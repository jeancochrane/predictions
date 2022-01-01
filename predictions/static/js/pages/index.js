import React from "react"
import ReactDOM from "react-dom"

import Sticky from "../components/sticky"
import Cursor from "../components/cursor"
import Map from "../components/map"
import Chat from "../components/chat"

const getRandomId = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}


class IndexPage extends React.Component {
  constructor(props) {
    super(props)
    this.userMap = props.userMap  // Map of cursor info indexed by user ID
    this.state = {
      currText: '',  // Current prediction text (controlled by the form input)
      predictions: props.predictions ? props.predictions : [],  // List of prediction objects
      cursors: {},  // Map of cursor objects, indexed by user ID
      messages: props.messages ? props.messages : [],  // List of messages in the chat
    }
  }

  componentDidMount = () => {
    // Only open websocket connections if the game is active
    this.sockets = {}
    if (this.isActive()) {
      this.connect('cursor', '/ws/cursor/', this.onCursorMessage),
      this.connect('chat', '/ws/chat/', this.onChatMessage),
      this.connect('predictions', '/ws/predictions/', this.onPredictionMessage)
      // Only start tracking the cursor if the user has the correct permissions
      if (this.userHasPermissions()) {
        this.initializeCursorTracker()
      }
    }
  }

  isActive = () => {
    // Whether or not the predictions game is active
    return (this.props.isActive ? true : false)
  }

  userHasPermissions = () => {
    // Whether or not the current user has permissions to add predictions
    return (this.props.userHasPermissions ? true : false)
  }

  connect = (key, url, onMessage) => {
    // Connect a websocket to a URL with a message callback function onMessage,
    // saving it to the given key on the `sockets` attr on this class
    const socketProtocol = window.location.protocol.startsWith('https') ? 'wss' : 'ws'
    let socket = new WebSocket(`${socketProtocol}://${window.location.host}${url}`)
    socket.onopen = () => {
      console.log(`${url} socket connected`)
    }
    socket.onmessage = onMessage
    socket.onclose = () => {
      if (!this.shownConnectionError) {
        alert(
          `The ${key} websocket closed unexpectedly. This means you won't ` +
          `see live ${key} updates from other users until the websocket reconnects. ` +
          `Your browser will attempt to reconnect every 5 seconds, but you can ` +
          `also manually reconnect by refreshing the page. Contact Jean if this ` +
          `error persists even after a refresh.`
        )
        this.shownConnectionError = true
      }
      console.error(`${url} socket closed, reconnecting in 5 seconds`)
      setTimeout(() => {this.connect(key, url, onMessage)}, 5000)
    }
    socket.onerror = (err) => {
      console.error(
        `${url} socket encountered an error: ${err.message}\n`,
        'Closing socket and attempting to reopen it.'
      )
      socket.close()
    }
    this.sockets[key] = socket
  }

  onCursorMessage = (message) => {
    const data = JSON.parse(message.data)
    this.updateCursor(data.userId, data.x, data.y)
  }

  updateCursor = (userId, x, y) => {
    this.setState(state => {
      let cursors = {...state.cursors}
      cursors[userId] = {x, y}
      return {...state, cursors}
    })
  }

  onChatMessage = (message) => {
    const data = JSON.parse(message.data)
    this.updateChat(data.userId, data.messageId, data.text, data.created, "post")
  }

  updateChat = (userId, id, text, created, type) => {
    const username = this.userMap[userId].username
    this.setState(state => {
      // Prepend new message to array of existing messages, since messages are
      // reversed in the Chat component
      return {
        ...state,
        messages: [{userId, username, id, text, created, type}].concat(
          state.messages
        )
      }
    })
  }

  onPredictionMessage = (message) => {
    const data = JSON.parse(message.data)
    switch (data.type) {
      case 'create':
        this.addPrediction(data.id, data.text, data.userId, data.color, data.positionX, data.positionY)
        // Add a notification to the chat
        const chatText = `New prediction: "${data.text}"`
        const chatId = getRandomId(25)
        this.updateChat(data.userId, chatId, chatText, null, "notification")
        break
      case 'update':
        this.updatePrediction(data.id, data.positionX, data.positionY)
        break
      case 'delete':
        this.removePrediction(data.id)
        break
      case 'error':
        alert(data.text)
        break
      default:
        console.error(`Unrecognized message type: ${data.type}`)
    }
  }

  addPrediction = (id, text, userId, color, positionX, positionY) => {
    this.setState(state => {
      return {
        ...state,
        predictions: state.predictions.concat(
          {id, text, userId, color, positionX, positionY}
        )
      }
    })
  }

  updatePrediction = (id, positionX, positionY) => {
    this.setState(state => {
      let predictions = [...state.predictions]
      for (let prediction of predictions) {
        if (prediction.id === id) {
          prediction.positionX = positionX
          prediction.positionY = positionY
        }
      }
      return {
        ...state,
        predictions
      }
    })
  }

  removePrediction = (predictionId) => {
    this.setState(state => {
      return {
        ...state,
        predictions: state.predictions.filter(prediction => prediction.id !== predictionId)
      }
    })
  }

  initializeCursorTracker = () => {
    // Track the current position of the mouse
    let prevCursorX, prevCursorY, currCursorX, currCursorY
    document.onmousemove = (e) => {
      const event = e || window.event
      currCursorX = event.pageX
      currCursorY = event.pageY
    }
    // Send cursor position to the socket every 500 ms if the cursor has moved
    window.setInterval(() => {
      if (prevCursorX !== currCursorX || prevCursorY !== currCursorY) {
        prevCursorX = currCursorX
        prevCursorY = currCursorY
        this.sockets.cursor.send(JSON.stringify({
          'type': 'cursor',
          'x': currCursorX,
          'y': currCursorY
        }))
      }
    }, 100)
  }

  handleChange = (e) => {
    this.setState({currText: e.target.value})
  }

  handleSubmit = (e) => {
    // Send a message to the socket to create a new prediction
    e.preventDefault()
    if (this.isActive() && this.userHasPermissions()) {
      this.sockets.predictions.send(
        JSON.stringify(
          {
            type: 'create',
            text: this.state.currText,
            scrollTop: document.documentElement.scrollTop,
            scrollLeft: document.documentElement.scrollLeft,
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth
          }
        )
      )
      // Clear the textarea
      this.setState({currText: ''})
    }
  }

  handleClose = (predictionId) => {
    // Send a message to the socket to delete the prediction
    if (this.isActive() && this.userHasPermissions()) {
      this.sockets.predictions.send(JSON.stringify({type: 'delete', id: predictionId}))
    }
  }

  handleMouseUp = (predictionId, position) => {
    // Send a message to the socket to update the prediction position
    if (this.isActive() && this.userHasPermissions()) {
      this.sockets.predictions.send(JSON.stringify({
        type: 'update',
        id: predictionId,
        positionX: position.x,
        positionY: position.y
      }))
    }
  }

  handleMouseMove = (predictionId, position) => {
    // Reset the position, but don't send the new position to the server
    this.updatePrediction(predictionId, position.x, position.y)
  }

  handleSendChat = (message) => {
    if (this.isActive() && this.userHasPermissions()) {
      this.sockets.chat.send(JSON.stringify({ message }))
    } else {
      console.log('User must be logged in to send a chat message')
    }
  }

  render () {
    return (
      <>
        <div
          style={{
            position: "fixed",
            bottom: 15,
            left: 15,
            zIndex: 999,
            backgroundColor: "#fefefe",
            padding: 20,
            border: "2px solid #b7b7b7",
          }}
        >
          {this.isActive() ? (
            this.userHasPermissions() ?
              <form onSubmit={this.handleSubmit}>
                <label htmlFor="prediction-text">Add a new prediction:</label>
                <br />
                <textarea
                  name="prediction-text"
                  rows="5"
                  cols="30"
                  value={this.state.currText}
                  onChange={this.handleChange}
                />
                <br />
                <input type="submit" value="Submit" />
              </form>
              :
              <p><a href={this.props.loginUrl}>Log in</a> to start adding predictions.</p>
            )
            :
            <p>{this.props.dateMessage}</p>
          }
        </div>
        <div
          style={{
            position: "fixed",
            bottom: 15,
            right: 15,
            zIndex: 999,
            backgroundColor: "#fefefe",
            padding: 20,
            border: "2px solid #b7b7b7",
          }}
        >
          <Map predictions={this.state.predictions} />
        </div>
        <div
          style={{
            position: "fixed",
            bottom: 165,
            right: 15,
            zIndex: 999,
            backgroundColor: "#fefefe",
            padding: 20,
            border: "2px solid #b7b7b7",
          }}
        >
          <Chat
            messages={this.state.messages}
            userMap={this.userMap}
            isActive={this.isActive()}
            userHasPermissions={this.userHasPermissions()}
            handleSendChat={this.handleSendChat}
          />
        </div>
        {this.state.predictions.map(prediction => (
          <Sticky
            key={prediction.id}
            id={prediction.id}
            handleClose={this.handleClose}
            handleMouseMove={this.handleMouseMove}
            handleMouseUp={this.handleMouseUp}
            editable={this.props.userId === prediction.userId}
            position={{x: prediction.positionX, y: prediction.positionY}}
            color={prediction.color}
          >
            {this.userMap[prediction.userId].username}: {prediction.text}
          </Sticky>
        ))}
        {Object.entries(this.state.cursors).map(([userId, cursor]) => (
          <Cursor
            key={userId}
            userId={userId}
            x={cursor.x}
            y={cursor.y}
            username={this.userMap[userId].username}
            color={this.userMap[userId].color}
          />
        ))}
      </>
    )
  }
}

ReactDOM.render(
  React.createElement(IndexPage, window.props),
  window.reactMount
)
