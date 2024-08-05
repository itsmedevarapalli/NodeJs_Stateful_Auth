const express  = require("express");
const mongoose = require("mongoose");
const dotEnv = require("dotenv")
const ejs = require('ejs')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const User = require('./models/User')
var bcrypt = require('bcryptjs')



const app = express();
dotEnv.config();

const PORT = process.env.PORT || 5013

app.set('view engine', 'ejs')
app.use(express.static('public'));
// npmjs.com/package/express-session
app.use(express.urlencoded({extended:true}))


mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Mongo Connected Successfully!")
})
.catch((error) => {
    console.log(`${error}`)

});

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "mySession"

})

app.use(session({
    secret: "This is a Secret",
    resave: false,
    saveUninitialized:true,
    store:store
}))

const checkAuth = (req, res, next)  => {
    if(req.session.isAuthenticated) {
        next() 
    } else {
        res.redirect('/signup')
    }
}

app.get('/signup', (req, res) => {
    res.render('register')

})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/dashboard', checkAuth, (req, res) => {
    res.render('welcome')
})

// app.post('/register', async(req, res) => {
//     const {username, email, password} = req.body
//     try {
//         const newUser = new User({
//             username,
//             email,
//             password

//         })
//         await newUser.save()
//         req.session.personal = newUser.username
//         res.redirect('/login')
//     }catch(error){
//         console.error(error)
//         res.redirect('/signup')
//     }

// })

app.post('/register', async(req, res) => {
    const {username, email, password} = req.body
    let user  = await User.findOne({email})
    if(user){
        return res.redirect('/signup')
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    user = new User({
        username,
        email, 
        password:hashedPassword

    })
    req.session.person = user.username
    await user.save()
    res.redirect('/login')
})

app.post('/user-login',  async(req, res) => {
    const {email, password} = req.body

    const user = await User.findOne({email})

    if(!user) {
        return res.redirect('/signup')
    }

    const checkPassword = 
    await bcrypt.compare(password, user.password)
    if(!checkPassword){
        return res.redirect('/signup')
    }
    req.session.isAuthenticated = true

    res.redirect('/dashboard')

})

app.post('/logout', (req, res) =>{
    req.session.destroy((error) => {
        if(error) throw error;
        res.redirect('/signup')

    })

})

app.listen(PORT, () => {
    console.log(`Serer started and Running @ ${PORT}`);
});