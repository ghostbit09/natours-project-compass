/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    console.log(email, password);
    try{
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        //Si el loggin fue exitoso, entonces le lanza una alerta y redirige al usuario
        //al home
        if(res.data.status === 'success'){
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    }catch(err){
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try{
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
        });
        if (res.data.status = 'success') location.reload(true);
    }catch(err){
        showAlert('error', 'Error loggin out! Try again.');
    }
}
