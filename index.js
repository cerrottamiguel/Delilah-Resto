const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const CLAVE_SERVER = 'MICLAVEDESERVER';
const cors = require('cors');
const sequelize = require('sequelize');
const conexion = new sequelize('mysql://root@localhost:3306/delilah');

let usuarios = [
    {
        id: 1,
        nombre: "Sergio", 
        apellido: "Garcia", 
        email:"sergio@garcia.com", 
        password: md5("cuasimodo")
    }
];

//MIDDLEWARES
app.use(bodyParser.json());

app.use(cors());

const validateInfo = (req, res, next)=>{
    if(!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.password){
        console.log(req.body);
        res.status(400).send('Faltan Datos');
    } else {
        const resultadoRepetido = usuarios.find(element=>element.email === req.body.email);
        if(resultadoRepetido){
            res.status(400).send('Este email ya esta siendo usado')
        }else{
            return next()
        } 
    }

}
const autenticacion = (req, res, next) =>{
    try{
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(token, CLAVE_SERVER);
        if(verificarToken){
            req.usuario = verificarToken;
            return next();
        }
    } catch(e){
        res.status(400).json({ error:'Error al validar el usuario'})
        console.log(e)
    }
}
const esAdmin = (req, res, next)=>{
    const usuario = usuarios.find(element=>element.email === req.body.email);
    if(!usuario){
        res.status(404).send('Usuario No Encontrado')
    }else{
        if(!usuario.es_admin){
            usuario.es_admin = false;
        }
        if(usuario.es_admin == false){
            res.status(400).send('Usuario sin permiso, no eres administrador')
        }else{
            return next()
        }
    }
}


//ENDPOINTS

app.post("/registrar", validateInfo, (req, res) => {
    const nombreUsuario = req.body.nombreUsuario;
    const nombre = req.body.nombreCompleto;
    const apellido = req.body.apellido;
    const email = req.body.email;
    const password = req.body.password;
    const unidad = {id:usuarios.length + 1, nombreUsuario: nombreUsuario, nombre: nombre, apellido: apellido, email: email, password: md5(password)};
    res.status(201).json({ ok: "Usuario se creo correctamente, Bienvenido " + nombre + " " + apellido +
    '  Este es su token:     ' + jwt.sign(unidad, CLAVE_SERVER)});
});

app.put("/usuarios", (req, res)=>{
    const member = usuarios.find(element=>element.email===req.body.email);
    if(member){
        if(req.body.nombre){member.nombre = req.body.nombre;}
        if(req.body.apellido){member.apellido = req.body.apellido;}
        if(req.body.password){member.password = md5(req.body.password);}
        if(req.body.es_admin != member.es_admin){member.es_admin = req.body.es_admin;}
        if(!member.es_admin){member.es_admin = false}
        console.log(usuarios);
        res.status(200).send({'Modificaciones Guardadas': member}) 
    }
})

app.post('/login', autenticacion, (req, res)=>{
    res.send('Bienvenid@ ' + req.usuario.nombre + ' ' + req.usuario.apellido)
})

app.get('/usuarios', esAdmin, (req,res)=>{
    res.status(200).send(usuarios);
})

//CONSULTAS AL SERVIDOR DE BASE DE DATOS

async function hacerSelect(){

    try {
        const resultadoConsulta = await conexion.query("SELECT * FROM platos", {
            type: sequelize.QueryTypes.SELECT,
        });
        console.log(resultadoConsulta);
    } catch (error) {
        console.log(error)
    }
}

async function hacerSelectPorNombre(nombre){

    try {
        const resultadoConsulta = await conexion.query("SELECT * FROM platos WHERE nombre like " + nombre + "%", {
            type: sequelize.QueryTypes.SELECT,
        });
        console.log(resultadoConsulta);
    } catch (error) {
        console.log(error)
    }
}


//ERRORES GENERALES DE EXPRESS
app.use(function(err, req, res, next) {
    if(!err) return next();
    console.log('Error, algo salio mal', err);
    res.status(500).send('Error');
});

//ACTIVAR SERVIDOR EN PUERTO 3000 DEL LOCAL HOST
app.listen(3000, () => {
    console.log("Servidor Listo!");
  });

  hacerSelect();
  