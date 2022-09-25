import Document, { Html, Head, Main, NextScript } from "next/document";
import { Toaster } from "react-hot-toast";
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
                    <link
                        rel="stylesheet"
                        href="https://rsms.me/inter/inter.css"
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                    <Toaster />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
