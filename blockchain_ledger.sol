// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SydOmegaToken {
    string public constant name = "S.Y.D OMEGA 91717";
    string public constant symbol = "ΩSYD";
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 10000000000 * 10**uint256(decimals);
    
    address public immutable systemOwner;
    uint256 public immutable ownerLockedSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        systemOwner = _owner;
        
        // Secure exactly 51% to guarantee complete asset and governance safety
        ownerLockedSupply = (totalSupply * 51) / 100;
        balanceOf[systemOwner] = ownerLockedSupply;
        
        // 49% remaining for open global ecosystem utility and distribution
        balanceOf[address(this)] = totalSupply - ownerLockedSupply;
        
        emit Transfer(address(0), systemOwner, ownerLockedSupply);
        emit Transfer(address(0), address(this), balanceOf[address(this)]);
    }

    // Protection logic ensuring governance structural integrity remains unbroken
    function verifyGovernanceSafety() public view returns (bool) {
        return balanceOf[systemOwner] >= (totalSupply * 51) / 100;
    }
}
