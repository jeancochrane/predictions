import React from "react"
import ReactDOM from "react-dom"

import Sticky from "../components/sticky"
import Cursor from "../components/cursor"
import Map from "../components/map"


class IndexPage extends React.Component {
  constructor(props) {
    super(props)
    // Only open websocket connections if the game is active
    if (this.isActive()) {
      const socketProtocol = window.location.protocol === 'https' ? 'wss' : 'ws'
      // Always open a cursor socket
      this.cursorSocket = new WebSocket(
        `${socketProtocol}://${window.location.host}/ws/cursor/`
      )
      // Only open the predictions websocket if the user has permissions
      if (this.userHasPermissions()) {
        this.predictionSocket = new WebSocket(
          `${socketProtocol}://${window.location.host}/ws/predictions/`
        )
      }
    }
    this.userMap = props.userMap  // Map of cursor info indexed by user ID
    this.state = {
      currText: '',  // Current prediction text (controlled by the form input)
      predictions: props.predictions ? props.predictions : [],  // List of prediction objects
      cursors: {},  // Map of cursor objects, indexed by user ID
    }
  }

  isActive = () => {
    // Whether or not the predictions game is active
    return (this.props.isActive ? true : false)
  }

  userHasPermissions = () => {
    // Whether or not the current user has permissions to had predictions
    return (this.props.userHasPermissions ? true : false)
  }

  componentDidMount = () => {
    if (this.isActive()) {
      this.initializeCursorSocket()
      if (this.userHasPermissions()) {
        this.initializePredictionSocket()
      }
    }
  }

  initializeCursorSocket = () => {
    this.cursorSocket.onopen = () => {
      console.log('Cursor socket connected')
    }
    this.cursorSocket.onmessage = (message) => {
      const data = JSON.parse(message.data)
      this.updateCursor(data.userId, data.x, data.y)
    }
    this.cursorSocket.onclose = () => {
      console.error('Cursor socket close unexpectedly')
    }
    if (this.userHasPermissions()) {
      this.initializeCursorTracker()
    }
  }

  updateCursor = (userId, x, y) => {
    this.setState(state => {
      let cursors = {...state.cursors}
      cursors[userId] = {x, y}
      return {...state, cursors}
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
        this.cursorSocket.send(JSON.stringify({
          'type': 'cursor',
          'x': currCursorX,
          'y': currCursorY
        }))
      }
    }, 100)
  }

  initializePredictionSocket = () => {
    this.predictionSocket.onopen = () => {
      console.log('Predictions socket connected')
    }
    this.predictionSocket.onmessage = (message) => {
      const data = JSON.parse(message.data)
      switch (data.type) {
        case 'create':
          this.addPrediction(data.id, data.text, data.userId, data.color, data.positionX, data.positionY)
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
          console.log(`Unrecognized message type: ${data.type}`)
      }
    }
    this.predictionSocket.onclose = () => {
      console.error('Predictions socket closed unexpectedly')
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

  handleChange = (e) => {
    this.setState({currText: e.target.value})
  }

  handleSubmit = (e) => {
    // Send a message to the socket to create a new prediction
    e.preventDefault()
    if (this.isActive() && this.userHasPermissions()) {
      this.predictionSocket.send(JSON.stringify({type: 'create', text: this.state.currText}))
      // Clear the textarea
      this.setState({currText: ''})
    }
  }

  handleClose = (predictionId) => {
    // Send a message to the socket to delete the prediction
    if (this.isActive() && this.userHasPermissions()) {
      this.predictionSocket.send(JSON.stringify({type: 'delete', id: predictionId}))
    }
  }

  handleMouseUp = (predictionId, position) => {
    // Send a message to the socket to update the prediction position
    if (this.isActive() && this.userHasPermissions()) {
      this.predictionSocket.send(JSON.stringify({
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
          {this.isActive() && (
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
          )}
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
