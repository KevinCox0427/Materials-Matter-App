import React, { FunctionComponent } from "react";
import { createRoot } from 'react-dom/client';

declare global {
    type HomePageProps = {
        maps: MapDoc[]
    }
}

type Props = {
    ServerProps: ServerPropsType
}

const Home: FunctionComponent<Props> = (props) => {
    if(!props.ServerProps.homePageProps) return <></>
    
    return <main>
        <h1>Materials Matter Prototype</h1>
        <div className="Title">
            <h2>Maps:</h2>
            <a href="/map/new">+ New Map</a>
        </div>
        <div className="Maps">
            {props.ServerProps.homePageProps.maps.map((map, i) => {
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