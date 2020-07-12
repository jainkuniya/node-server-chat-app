const WebSocket = require('ws');
const uuidv4 = require('uuid');

const wss = new WebSocket.Server({ port: 8085 });

// 1 socket === 1 user
let sockets = {};

wss.on('connection', (ws, request) => {
  // update list of users
  sockets = { ...sockets, [request.url.split('/').pop()]: { ws } };

  // broadcast to all users new user is added
  broadcast();

  // subscribe to on message
  ws.on('message', (data) => {
    // parse message
    const request = JSON.parse(data);

    // get to user
    const to = sockets[request.to];
    if (!to || to.ws.readyState !== WebSocket.OPEN) {
      // closed
      ws.send(JSON.stringify({ success: false }));
      return;
    }

    const message = {
      type: 'chatMessage',
      id: uuidv4.v4(),
      msg: request.msg,
      from: request.from,
      to: request.to,
    };
    to.ws.send(JSON.stringify(message));
    ws.send(JSON.stringify(message));
  });
});

const broadcast = () => {
  const allUsers = Object.keys(sockets);
  const response = { type: 'allUsers', users: allUsers };

  allUsers.forEach((id) => {
    sockets[id].ws.send(JSON.stringify(response));
  });
};
