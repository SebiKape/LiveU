const express = require('express');
const app = express();
const axios = require('axios');
const tp = require('tedious-promises');
const config = require('./config');
const queries = require('./db_queries');
const va = require('./validation_sa');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

async function create_connection(){
    await tp.setConnectionConfig(config.dbConfig);    
};

try {
    create_connection();
    console.log("connected");
} catch (error) {
    console.error(error);
};

app.get('/', (req,res) => {
    inputs = {};
    res.render('formulario', {inputs});
});

app.post('/', async (req,res) => { 
    try {
        //get data from request
        inputs = {
            nome: req.body.nome,
            sobrenome: req.body.sobrenome,
            email: req.body.email
        };
        //Validade and sanitize data
        result = va.validate(inputs);
        if (!result.check) {
            return res.status(400).render('formulario', {
                inputs,
                errorMessage: result.errorMessage
            });
        };
        inputs = va.sanitize(inputs);
        //convert data to urlencoded format
        let data = "nome=";
        data = data.concat(inputs.nome,"&sobrenome=",inputs.sobrenome,"&email=",inputs.email);
        //send request to api
        config.apiConfig.data = data;
        Api_res = await axios(config.apiConfig);
        Api_res_string = Api_res.data.split("#");
        // insert names and codes to database
        await queries.insertIntoDB(Api_res_string, inputs, tp);
        // select data from code tables for sum calculation
        soma = await queries.select_code_and_sum(Api_res_string, tp);
        if (!soma) {
            errorMessage = "Desculpe, parece que nosso banco de dados está ocupado, tente novamente mais tarde"
            return res.status(504).render('formulario', { 
                inputs,
                errorMessage
             });
        };
        // get animal, color and Country
        result = await queries.get_animal_color_country(soma, tp);
        res.status(201).render('formulario', {
            result: result[0]
        });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    };
});

app.listen(process.env.PORT || 4000);
