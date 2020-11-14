import React from "react"
import PropTypes from "prop-types"

import Header from "../components/header"

const Layout = ({ children }) => {
  return (
    <>
      <Header siteTitle="2021 Predictions" />
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <main>{children}</main>
        <footer></footer>
      </div>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
