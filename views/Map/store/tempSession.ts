import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type TempSession = null | FullSessionDoc

export const tempSessionSlice = createSlice({
    name: 'tempSession',
    initialState: null as TempSession,
    reducers: {
        addNewSession: (state, action: PayloadAction<number>) => {
            // Adding an extra day to the expiration date by default.
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 1);

            return {
                id: -1,
                mapId: action.payload,
                name: `New Session - ${(new Date()).toLocaleDateString()}`,
                start: convertDatetime((new Date()).toLocaleString()),
                expires: convertDatetime(expirationDate.toLocaleString()),
                comments: {}
            }
        },

        removeNewSession: (state) => {
            return null;
        }
    }
});

export const { addNewSession, removeNewSession } = tempSessionSlice.actions;

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