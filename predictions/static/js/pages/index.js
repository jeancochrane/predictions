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
      predictions: [],  // List of prediction objects
    }
  }

  componentDidMount = () => {
    this.client.onopen = () => {
      console.log('Websocket client connected')
    }
    this.client.onmessage = (message) => {
      const data = JSON.parse(message.data)
      this.addPrediction(data.username, data.text)
    }
    this.client.onclose = () => {
      console.error('Websocket closed unexpectedly')
    }
    // TODO: Load initial state from the database
  }

  addPrediction = (username, text) => {
    this.setState(state => {
      return {
        ...state,
        predictions: state.predictions.concat({text, username})
      }
    })
  }

  handleChange = (e) => {
    this.setState({currText: e.target.value})
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.client.send(JSON.stringify({text: this.state.currText}))
    this.setState({currText: ''})
  }

  handleClose = (predictionId) => {
    // TODO: Also send a message to the socket to remove the sticky
    this.setState(state => {
      return {
        ...state,
        predictions: state.predictions.filter(prediction => this.getPredictionId(prediction) !== predictionId)
      }
    })
  }

  getPredictionId  = (prediction) => {
    return `${prediction.username}: ${prediction.text}`
  }

  render () {
    return (
      <Layout>
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
        {this.state.predictions.map(prediction => (
          <Sticky
            key={prediction.text}
            id={this.getPredictionId(prediction)}
            handleClose={this.handleClose}
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
