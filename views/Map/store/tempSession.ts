import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from './store';

type TempSession = null | FullSessionDoc

export const tempSessionSlice = createSlice({
    name: 'tempSession',
    initialState: null as TempSession,
    reducers: {
        addNewSession: (state) => {
            // Getting map state
            const map = useSelector(mapState => mapState.map);

            // Adding an extra day to the expiration date by default.
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 1);

            state = {
                id: -1,
                mapId: map.id,
                name: `New Session - ${(new Date()).toLocaleDateString()}`,
                start: convertDatetime((new Date()).toLocaleString()),
                expires: convertDatetime(expirationDate.toLocaleString()),
                comments: {}
            }
        }
    }
});

export const { addNewSession } = tempSessionSlice.actions;

/**
 * A helper function to convert HH:MM:SS AM/PM to HH:MM:SS
 * @param time The inputted time string
 */
function convertDatetime(datetime:string) {
    const dateArray = datetime.split(', ')[0].split('/');
    dateArray.unshift(dateArray.pop()!);
    const dateString = dateArray.map(value => value.padStart(2, '0')).join('-');

    const time = datetime.split(', ')[1];
    const timeString = time.split(':').map((timeSection, i) => (parseInt(timeSection) + (i == 0 && time.slice(-2) === 'PM' ? 12 : 0)).toString().padStart(2, '0')).join(':');

    return `${dateString} ${timeString}`;
}