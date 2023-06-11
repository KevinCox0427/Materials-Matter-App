import React, { FunctionComponent } from "react";
import { createRoot } from 'react-dom/client';

/**
 * Declaring globally what properties this page should inherited from the server under "HomePageProps".
 */
declare global {
    type HomePageProps = {
        maps: MapDoc[]
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
    
    return <main>
        <h1>Materials Matter Prototype</h1>
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