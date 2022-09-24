import Document, {
    Html,
    Head,
    Main,
    NextScript,
} from "next/document";

// A special Next.js component that is used to initialize pages. 
// It's common to override this component to add global CSS or 
// other elements that are needed on every page to the "head" of the HTML document.
class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    render() {
        return (
            <Html>
                <Head>
                    <link rel="stylesheet" href="https://rsms.me/inter/inter.css"/>
                    {/* <script async defer src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&callback=initMap`}></script> */}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;