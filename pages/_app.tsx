import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link
                href="https://fonts.googleapis.com/css2?family=RocknRoll+One&display=swap"
                rel="stylesheet"
            />

            <div className="conatiner mx-auto px-4">
                <Component {...pageProps} />
            </div>
        </>
    );
}

export default MyApp;
