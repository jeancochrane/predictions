import React from 'react'

class Map extends React.Component {
  constructor(props) {
    super(props)
    this.width = 100
    this.documentWidth = 5000
    this.state = {
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      windowScrollX: window.scrollX,
      windowScrollY: window.scrollY
    }
  }

  componentDidMount = () => {
    window.addEventListener('scroll', this.handleScroll)
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.handleResize)
  }

  handleScroll = (event) => {
    this.setState({
      windowScrollX: window.scrollX,
      windowScrollY: window.scrollY
    })
  }

  handleResize = (event) => {
    this.setState({
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight
    })
  }

  scaleByCanvas = (val) => {
    // Scale a value by the size of the canvas. Used for calculating values
    // to represent on the scaled-down version of the canvas represented on
    // the map.
    return (val * this.width) / this.documentWidth
  }

  render = () => (
    <div
      style={{
        position: "relative",
        width: this.width,
        height: this.width,
        border: "1px solid black"
      }}
    >
      <div
        style={{
          position: "absolute",
          border: "2px solid red",
          top: this.scaleByCanvas(this.state.windowScrollY),
          left: this.scaleByCanvas(this.state.windowScrollX),
          width: this.scaleByCanvas(this.state.windowInnerWidth),
          height: this.scaleByCanvas(this.state.windowInnerHeight)
        }}
      >
      </div>
      {this.props.predictions.map(prediction => (
        <div
          key={prediction.id}
          style={{
            width: 5,
            height: 5,
            backgroundColor: prediction.color,
            position: "absolute",
            left: this.scaleByCanvas(prediction.positionX),
            top: this.scaleByCanvas(prediction.positionY)
          }}
        >
        </div>
      ))}
    </div>
  )
}

export default Map
