import React from "react"
import ReactDOM from "react-dom"

import Layout from "../components/layout"
import Sticky from '../components/sticky'


class IndexPage extends React.Component {
  constructor(props) {
    super(props)
    // TODO: Only open a connection if the user is staff and env variable is set
    this.client = new WebSocket(`ws://${window.location.host}/ws/predictions/2020/`)
    this.state = {
      currText: '',  // Current prediction text (controlled by the form input)
      predictions: props.predictions ? props.predictions : [],  // List of prediction objects
    }
  }

  componentDidMount = () => {
    this.client.onopen = () => {
      console.log('Websocket client connected')
    }
    this.client.onmessage = (message) => {
      const data = JSON.parse(message.data)
      switch (data.type) {
        case 'create':
          this.addPrediction(data.id, data.text, data.username)
          break
        case 'delete':
          this.removePrediction(data.id)
          break
        default:
          console.log(`Unrecognized message type: ${data.type}`)
      }
    }
    this.client.onclose = () => {
      console.error('Websocket closed unexpectedly')
    }
  }

  addPrediction = (id, text, username) => {
    this.setState(state => {
      return {
        ...state,
        predictions: state.predictions.concat({id, text, username})
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
    this.client.send(JSON.stringify({type: 'create', text: this.state.currText}))
    // Clear the textarea
    this.setState({currText: ''})
  }

  handleClose = (predictionId) => {
    // Send a message to the socket to delete the prediction
    this.client.send(JSON.stringify({type: 'delete', id: predictionId}))
  }

  render () {
    return (
      <Layout>
        {this.props.username ?
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="prediction-text">Add a new prediction:</label>
            <br />
            <textarea name="prediction-text"
              value={this.state.currText}
              onChange={this.handleChange}
            />
            <br />
            <input type="submit" value="Submit" />
          </form>
          :
          <p><a href={this.props.loginUrl}>Log in</a> to start adding predictions.</p>
        }
        {this.state.predictions.map(prediction => (
          <Sticky
            key={prediction.id}
            id={prediction.id}
            handleClose={this.handleClose}
            showCloseButton={this.props.username === prediction.username}
          >
            {prediction.username}: {prediction.text}
          </Sticky>
        ))}
      </Layout>
    )
  }
}

ReactDOM.render(
  React.createElement(IndexPage, window.props),
  window.reactMount
)
