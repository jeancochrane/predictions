import React from 'react'
import ReactDOM from 'react-dom'

const getOffset = (element) => {
  if (!element.getClientRects().length) {return {top: 0, left: 0}}
  const rect = element.getBoundingClientRect();
  const win = element.ownerDocument.defaultView;
  return {
    top: rect.top + win.pageYOffset,
    left: rect.left + win.pageXOffset
  }
}

class Sticky extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pos: props.initialPos ? props.initialPos : {x: 0, y: 0},
      dragging: false,
      rel: null // position relative to the cursor
    }
  }

  // we could get away with not having this (and just having the listeners on
  // our div), but then the experience would be possibly be janky. If there's
  // anything w/ a higher z-index that gets in the way, then you're toast,
  // etc.
  componentDidUpdate = (props, state) => {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    }
  }

  // calculate relative position to the mouse and set dragging=true
  onMouseDown = (e) => {
    const pos = getOffset(ReactDOM.findDOMNode(this))
    this.setState({
      dragging: true,
      rel: {
        x: e.pageX - pos.left,
        y: e.pageY - pos.top
      }
    })
    e.stopPropagation()
    e.preventDefault()
  }

  onMouseUp = (e) => {
    this.setState({dragging: false})
    e.stopPropagation()
    e.preventDefault()
  }

  onMouseMove = (e) => {
    if (!this.state.dragging) return
    this.setState({
      pos: {
        x: e.pageX - this.state.rel.x,
        y: e.pageY - this.state.rel.y
      }
    })
    e.stopPropagation()
    e.preventDefault()
  }

  handleClose = (e) => {
    this.props.handleClose(this.props.id)
    e.preventDefault()
  }

  render = () => {
    return (
      <div
        className='sticky'
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        style={{
          position: 'absolute',
          left: this.state.pos.x + 'px',
          top: this.state.pos.y + 'px',
        }}
      >
        <span style={{float: 'right'}}>
          <button
            type="button"
            className="close"
            onClick={this.handleClose}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </span>
        {this.props.children}
      </div>
    )
  }
}

export default Sticky
