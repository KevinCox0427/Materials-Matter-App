import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type TempSession = null | FullSessionDoc

/**
 * A redux slice representing a new session that a user creates.
 */
export const tempSessionSlice = createSlice({
    name: 'tempSession',
    initialState: null as TempSession,
    reducers: {
        /**
         * A reducer function to add a new session.
         * @param action The mapId that the new session is being added to.
         */
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

        /**
         * A reducer function to remove the new session.
         */
        removeNewSession: (state) => {
            return null;
        }
    }
});

export const { addNewSession, removeNewSession } = tempSessionSlice.actions;

/**
 * A helper function to convert MM:DD:YYYY HH:MM:SS AM/PM to YYYY:MM:DD HH:MM:SS
 * @param time The inputted time string
 */
function convertDatetime(datetime:string) {
    const dateArray = datetime.split(', ')[0].split('/');
    dateArray.unshift(dateArray.pop()!);
    const dateString = dateArray.map(value => value.padStart(2, '0')).join('-');

    const time = datetime.split(', ')[1];
    const timeSections = time.split(':');

    if(time.slice(-2) === 'PM' && timeSections[0] !== '12') {
        timeSections[0] = (parseInt(timeSections[0]) + 12).toString().padStart(2, '0');
    }
    if(time.slice(-2) === 'AM' && timeSections[0] === '00') {
        timeSections[0] = (parseInt(timeSections[0]) + 12).toString().padStart(2, '0');
    }

    timeSections[2] = timeSections[2].split(' ')[0];

    return `${dateString} ${timeSections.join(':')}`;
}