import React from "react"
import ReactDOM from "react-dom"

import Layout from "../components/layout"
import Sticky from '../components/sticky'


class IndexPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currText: '',
      currStickyId: 1,
      stickies: [],
    }
  }

  handleChange = (e) => {
    this.setState({currText: e.target.value})
  }

  handleSubmit = (e) => {
    this.setState(state => {
      return {
        ...state,
        currText: '',  // Clear current text
        currStickyId: state.currStickyId + 1,  // Increment sticky IDs
        stickies: state.stickies.concat({
          text: state.currText,
          id: state.currStickyId,
        })
      }
    })
    e.preventDefault()
  }

  handleClose = (stickyId) => {
    this.setState(state => {
      return {
        ...state,
        stickies: state.stickies.filter(sticky => sticky.id !== stickyId)
      }
    })
  }

  render () {
    return (
      <Layout>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="sticky-text">Add a new prediction:</label>
          <br />
          <textarea name="sticky-text"
            value={this.state.currText}
            onChange={this.handleChange}
          />
          <br />
          <input type="submit" value="Submit" />
        </form>
        {this.state.stickies.map(sticky => (
          <Sticky
            key={sticky.id}
            id={sticky.id}
            handleClose={this.handleClose}
          >
            {sticky.text}
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
