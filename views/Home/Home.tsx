import React, { FunctionComponent } from "react";
import { createRoot } from 'react-dom/client';

/**
 * Declaring globally what properties this page should inherited from the server under "HomePageProps".
 */
declare global {
    type HomePageProps = {
        maps: MapDoc[],
        userData?: {
            userId: number
            firstName: string,
            lastName: string,
            image: string
        } | undefined
    }
}

type Props = {
    ServerProps: ServerPropsType
}

/**
 * A React page that will render the homepage. This will link to all the map editors.
 * 
 * @param maps The configuration of the maps to render all the options.
 */
const Home: FunctionComponent<Props> = (props) => {
    /**
     * Making sure we inherited the properties from the server.
     */
    const pageProps = props.ServerProps.homePageProps;
    if(!pageProps) return <></>
    
    return <>
        <header>
            <h1>Materials Matter Prototype</h1>
            {pageProps.userData ? 
                <div className="Profile">
                    <a href="/users/logout">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        Logout
                    </a>
                    <img src={pageProps.userData.image} alt={`${pageProps.userData.firstName} ${pageProps.userData.lastName}'s Profile Picture`}></img>
                    <p>{pageProps.userData.firstName} {pageProps.userData.lastName}</p>
                </div> 
            : 
                <div className="Profile">
                    <a href="/users/login">
                        <i className="fa-solid fa-user"></i>
                        Login
                    </a>
                </div>
            }
        </header>
        <main>
            <div className="Title">
                <h2>Maps:</h2>
                <a href="/map/new">+ New Map</a>
            </div>
            <div className="Maps">
                {pageProps.maps.map((map, i) => {
                    return <div className="Map" key={i}>
                        <a href={`/map/${map.id}`}>{map.name}</a>
                        <i className="fa-solid fa-trash-can"></i>
                    </div>
                })}
            </div>
        </main>
    </>
}

/**
 * Rendering our react element to the root element.
 */
const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
    <React.StrictMode>
        <Home ServerProps={window.ServerProps}></Home>
    </React.StrictMode>
);

export default Home;