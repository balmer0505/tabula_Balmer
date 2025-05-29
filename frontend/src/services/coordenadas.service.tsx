

import axios from 'axios';
import { CONFIG } from 'src/services/configuration.service';

const url = CONFIG.url + CONFIG.versionApi;

export const postCoordenadas = async (enviarParametros: any) => {
    try {
        // console.log(`${url}/coordenadas`, "datops enviados", JSON.stringify(enviarParametros))
        const response = await axios.post(`${url}/coordenadas`, enviarParametros, {

            headers: {
                // 'Authorization': 'Bearer ' + token,
                // 'Content-Type': 'multipart/form-data',
                'Content-Type': 'application/json', // Cambia multipart/form-data por application/json

            },
        });
        // console.log(`${url}/coordenadas`, "BJHGJHGKJ")
        // console.log(response, 'RESPONSE UPLOAD');
        return response;
    } catch (error: any) {
        console.error('Error al enviar el json:', error);
        return error.response;
    }
};
