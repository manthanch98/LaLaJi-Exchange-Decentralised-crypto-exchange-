pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./UdhariToken.sol";

contract Exchange{

    using SafeMath for uint;

    //Variables
    address public feeAccount;              //account that stores fees
    uint public feePercent;               //fees Percentage
    address constant ETHER = address(0); //Store ETHER in tokens mapping wit blank address

    //Events
    event Deposit(address token, address user, uint amount, uint balance);
    event Withdraw(address token, address user, uint amount, uint balance);
    event Order(uint id,address user,address tokenGet,uint amountGet,address tokenGive,uint amountGive,uint timestamp);
    event Cancel(uint id,address user,address tokenGet,uint amountGet,address tokenGive,uint amountGive,uint timestamp);
    event Trade(uint id,address user,address tokenGet,uint amountGet,address tokenGive,uint amountGive,address userFill,uint timestamp);

    //MAPPING

    //
    mapping(address => mapping(address => uint)) public tokens;
    //store the order
    mapping(uint => _Order) public orders;
    //canceled order
    mapping(uint=> bool) public orderCancelled;
    mapping(uint=> bool) public orderFilled;

    //model the order
    struct _Order{
        uint id;
        address user;
        address tokenGet;
        uint amountGet;
        address tokenGive;
        uint amountGive;
        uint timestamp;
    }

    uint public orderCount;

    


    constructor(address _feeAccount, uint _feePercent) public {
        feeAccount= _feeAccount;            
        feePercent= _feePercent;            
        
    }

    //Fallback: reverts if ether is sent to this smart contract
    function fallback() external {
        revert();
    }

    function depositEther() payable public{
        tokens[ETHER][msg.sender]= tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value,tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint _amount)  public {
        require(tokens[ETHER][msg.sender]>= _amount);
        tokens[ETHER][msg.sender]= tokens[ETHER][msg.sender].sub(_amount);
        payable(msg.sender).transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint _amount) public {
        require(_token!= ETHER);
        require(UdhariToken(_token).transferFrom(msg.sender,address(this), _amount));
        tokens[_token][msg.sender]= tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount,tokens[_token][msg.sender]);

    }

    function withdrawTokens(address _token, uint _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender]>= _amount);
        tokens[_token][msg.sender]= tokens[_token][msg.sender].sub(_amount);
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns(uint) {
        return tokens[_token][_user];
    }

    //add order to storage
    function makeOrder(address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive) public{
        orderCount= orderCount.add(1);
        orders[orderCount]= _Order(orderCount, msg.sender, _tokenGet,_amountGet,_tokenGive,_amountGive, block.timestamp);
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    //marks cancelled order
    function cancelOrder(uint _id) public {
        //fetchin order
        _Order storage _order= orders[_id];

        //must be senders order
        require(address(_order.user)== msg.sender);
        require(_order.id ==_id);

        orderCancelled[_id]= true;
        emit Cancel( _order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
    }

    function fillOrder(uint _id) public {
        require(_id>0 && _id<= orderCount);
        require(!orderFilled[_id]);
        require(!orderFilled[_id]);
        _Order storage _order= orders[_id];
        _trade(_order.id,_order.user,_order.tokenGet,_order.amountGet,_order.tokenGive,_order.amountGive);
        orderFilled[_order.id]= true;
    }

    function _trade(uint _orderId,address _user,address _tokenGet,uint _amountGet,address _tokenGive,uint _amountGive) internal {
        
        uint _feeAmount= _amountGive.mul(feePercent).div(100);

        
        tokens[_tokenGet][msg.sender]=tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user]= tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount]= tokens[_tokenGet][feeAccount].add(_feeAmount);
        tokens[_tokenGive][_user]= tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender]= tokens[_tokenGive][msg.sender].add(_amountGive);

        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive,msg.sender,  block.timestamp);


    }




}


//Deposite & Withdraw
//Manage Orders  - make or cancel
//Handle trades =Charge fees

//TODO:
//1 Deposide ether          00
//2 withdraw ether          00
//3 deposite token          00
//4 withdraw token          00
//5 check balance           00
//6 make order              00
//8 cancel order            00
//9 fill order
//10 charge fees