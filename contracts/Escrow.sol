// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller");
        _;
    }

    modifier onlyBuyer(uint256 nftID) {
        require(msg.sender == buyer[nftID], "Only buyer");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector");
        _;
    }

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    // Seller lists a property
    function list(
        uint256 nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), nftID);
        isListed[nftID] = true;
        purchasePrice[nftID] = _purchasePrice;
        escrowAmount[nftID] = _escrowAmount;
        buyer[nftID] = _buyer;
    }

    // Buyer deposits earnest money
    function depositEarnest(uint256 nftID) public payable onlyBuyer(nftID) {
        require(msg.value >= escrowAmount[nftID], "Insufficient deposit");
    }

    // Inspector approves/rejects
    function updateInspectionStatus(
        uint256 nftID,
        bool passed
    ) public onlyInspector {
        inspectionPassed[nftID] = passed;
    }

    // Each party approves the sale
    function approveSale(uint256 nftID) public {
        approval[nftID][msg.sender] = true;
    }

    // Finalize sale — transfers NFT to buyer, ETH to seller
    function finalizeSale(uint256 nftID) public {
        require(inspectionPassed[nftID], "Inspection not passed");
        require(approval[nftID][buyer[nftID]], "Buyer not approved");
        require(approval[nftID][seller], "Seller not approved");
        require(approval[nftID][lender], "Lender not approved");
        require(
            address(this).balance >= purchasePrice[nftID],
            "Insufficient funds"
        );

        isListed[nftID] = false;
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success, "Transfer failed");
        IERC721(nftAddress).transferFrom(address(this), buyer[nftID], nftID);
    }

    // Cancel sale — refund buyer if inspection failed
    function cancelSale(uint256 nftID) public {
        uint256 bal = address(this).balance;
        if (!inspectionPassed[nftID]) {
            (bool success, ) = payable(buyer[nftID]).call{value: bal}("");
            require(success, "Refund to buyer failed");
        } else {
            (bool success, ) = payable(seller).call{value: bal}("");
            require(success, "Payout to seller failed");
        }
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
