var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// var nickNameList = [{
//   name: 'Mike',
//   isUsed: false,
// },
// {
//   name: 'Jack',
//   isUsed: false,
// },
// {
//   name: 'Tony',
//   isUsed: false,
// },{
//   name: 'Justin',
//   isUsed: false,
// },{
//   name: 'James',
//   isUsed: false,
// }];

var nickNameList = ['Mike', 'Jack', 'Tony', 'Justin', 'James'];

var messageQueue = [];
var currentUsers = [];


io.on('connection', function(socket) {

  console.log('a user connected');

  io.emit('chat history', messageQueue);
  io.emit('current users', currentUsers);

  socket.on('user in', function(user) {
    io.emit('user in', user);
    userExist = false;
    for (var i = 0; i < currentUsers.length; i++) {
      if (currentUsers[i].name == user) {
        userExist = true;
      }
    }
    if (!userExist) {
      user.socketId = this.id;
      currentUsers.push(user);
      console.log(currentUsers);
    }
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
    var userIndex = currentUsers.findIndex(user => {
      user.socketId = this.id;
    });
    currentUsers.splice(userIndex, 1);
    io.emit('current users', currentUsers);
  });

  socket.on('chat message', function(msg) {
    console.log('message: ' + msg.content);
    messageQueue.push(msg);
    if (messageQueue.length > 200) {
      messageQueue.shift();
    }
    io.emit('chat message', msg);
  });

  socket.on('get default nickname', function() {
    for (var i = 0; i < nickNameList.length; i++) {
      var nameExist = false;
      var u = currentUsers.find(us => us.name == nickNameList[i]);
      if (u) {
        nameExist = true;
      }
      if (!nameExist) {
        io.emit('get default nickname', nickNameList[i]);
        break;
      }
    }
  });

  socket.on('update user', function(result) {
    var user = result.user;
    var newName = result.newName;
    var newColor = result.newColor;
    var nameDuplicate = false;
    if (user.name !== newName) {
      var u = currentUsers.find(us => us.name == newName);
      if (u) {
        nameDuplicate = true;
      }
    }
    var retVal = {
      result: !nameDuplicate,
      newName: newName
    };
    io.emit('update user', retVal);
    if (!nameDuplicate) {
      var usr = currentUsers.find(us => us.name == user.name);
      usr.name = newName;
      usr.color = newColor;
      for (var j = 0; j < messageQueue.length; j++){
        if (user.name == messageQueue[j].user.name) {
          messageQueue[j].user.name = newName;
          messageQueue[j].user.color = newColor;
        }
      }
    }

    io.emit('current users', currentUsers);
    io.emit('chat history', messageQueue);

  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});