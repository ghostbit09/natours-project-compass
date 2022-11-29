/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
    
    try{
        //1. Obtenemos la checkout session de la API
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        
        //2. Creamos el checkout form y cargamos el form para ingresar la tarjeta de credito
        window.location.replace(session.data.session.url);
    }catch(err){
        showAlert('error', err);
    }

};