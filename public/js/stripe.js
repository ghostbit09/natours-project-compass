/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
    
    //Para manejo de pagos
    //Esto ya no funciona en la nueva version de Stripe
    // const stripe = Stripe('pk_test_51M8qT4IINvTlJFxBtsV8scZcnRirZoQJgKj7L3e6KgNTdPW8BwVAOkasWvOAO6LlkGQ6GKJU9iYfr32w2tBKxcSl00gJJMje0m');
    
    try{
        //1. Obtenemos la checkout session de la API
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );

        //2. Creamos el checkout form y cargamos la tarjeta de credito
        //Esto ya no funciona en la nueva version de Stripe
        // await stripe.redirectToCheckout({
        //     sessionId: session.data.session.id
        // });

        window.location.replace(session.data.session.url);
    }catch(err){
        console.log(err);
        showAlert('error', err);
    }

};