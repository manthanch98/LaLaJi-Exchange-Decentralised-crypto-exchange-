pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UdhariToken{
using SafeMath for uint;

string public name="Udhari";
string public symbol="UDH";
uint public decimals= 18;
uint public totalSupply;

mapping(address => uint) public balanceOf;
mapping(address => mapping(address => uint)) public allowance;


event Transfer(address indexed _from, address indexed _to, uint256 _value);
event Approval(address indexed _owner, address indexed _spender, uint256 _value);

constructor() public {
    totalSupply=10000000*(10 ** decimals);
    balanceOf[msg.sender]= totalSupply;
}

function transfer(address _to, uint256 _value) public returns (bool success){
    require(balanceOf[msg.sender]>= _value);
    _transfer(msg.sender, _to, _value);
    return true;
}

function approve(address _spender, uint256 _value) public returns(bool success) {
    require(_spender != address(0));

    allowance[msg.sender][_spender]= _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
}

function _transfer(address _from, address _to, uint _value) internal {
    require(_to != address(0));
    balanceOf[_from]= balanceOf[_from].sub(_value);
    balanceOf[_to]= balanceOf[_to].add(_value);
    emit Transfer(_from,_to,_value);
}

function transferFrom(address _from , address _to, uint _value) public returns(bool success) {
    require(_value <= balanceOf[_from]);
    require(_value <= allowance[_from][msg.sender]);
    allowance[_from][msg.sender]= allowance[_from][msg.sender].sub(_value);
    _transfer(_from ,_to , _value);
    return true;
}

// function name() public returns (string) {
//     return name;
// }

// function symbol() public view returns (string){

// }

// function decimals() public view returns (uint8){

// }

// function totalSupply() public view returns (uint256){

// }

// function balanceOf(address _owner) public view returns (uint256 balance){

// }








}