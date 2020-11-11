import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Sticky from '../components/sticky'

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <Sticky>
      Drag Me! See how children are passed through to the div!
    </Sticky>
  </Layout>
)

export default IndexPage
