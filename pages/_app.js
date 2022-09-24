import '../styles/globals.css'

import { Wrapper, Status } from "@googlemaps/react-wrapper";


function MyApp({ Component, pageProps }) {

  const render = (status) => {
    return <h1>{status}</h1>;
  };

  return (
    
    <Wrapper apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY} render={render} libraries={["places"]}>
      <Component {...pageProps} />
    </Wrapper>
  )
}

export default MyApp
