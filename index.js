import express, { response } from 'express';
import mysql from 'mysql';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';

const salt = 10;

const app = express();
// app.use((req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://lwa-poc.netlify.app');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   })

app.use(express.json());
app.use(cors());
app.use(cors({
    // origin: ['https://Rutuja1123.github.io/lwa-poc'],
    origin: ['https://lwa-poc.netlify.app/login', 'http://localhost:3000', 'https://na.account.amazon.com', 'https://api.amazonalexa.com/v1/users/~current/skills/amzn1.ask.skill.4372204c-a922-4cd9-a20c-1dd6ad55c8f6/enablement'],
    methods: ['GET', 'POST'],
    credentials: true
}));
// app.use(cors({
//     // origin: ['http://54.227.1.200/'],
//     origin: ['https://na.account.amazon.com'],
//     methods: ['GET', 'POST'],
//     credentials: true
// }));
app.use(cookieParser());
  

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'lwa-poc'
// })

const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12716011',
    password: 'kMd5xyYQc8',
    database: 'sql12716011'
})
let amznEmail = "";
let lwa_access_token;
const verifyUser = (req, res, next) => {
    console.log('starting verifyUser');
    const token = req.cookies.token;
    lwa_access_token = req.cookies.lwatoken;
    // const lwatoken = req.cookies.lwatoken;
    // if(!token || !lwatoken) {
    if(!token) {
        return res.json({ Error: 'Token missing' });
    } else {
        // if (lwatoken) {
        //     req.email = amznEmail;
        //     next();
        // }
        // else {
        jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
            if(err) {
                return res.json({ Error: 'Token Error' });
            } else {
                req.email = decoded.email;
                next();
            }
        })
    // }
    }
}

app.get('/', verifyUser, (req, res) => {
    console.log('calling verifyUser');
    return res.json({Status: "success", email: req.email});
})

app.post('/amazon/profile', (req, res) => {
    console.log('starting amazon profile');
    // const delsql = "DELETE FROM login WHERE email = ?";
    // db.query(delsql, ["sma-team@amazon.com"], (err, result) => {
    //     if(err) return res.json(err);
    //     console.log("delete");
    //     return res.json({Status: "success"});
    // })
    amznEmail = req.body.PrimaryEmail;
    console.log("updating database-1");
    const upsql = "SELECT * FROM login WHERE email = ?";
    db.query(upsql, [req.body.PrimaryEmail], (err, result) => {
        if(err) return res.json(err);
        if(result.length > 0) {
            const sql1 =  "UPDATE login SET id = ? WHERE email = ?";
            const updateVal = [
                req.body.CustomerId,
                req.body.PrimaryEmail,
            ]
            db.query(sql1, updateVal, (err, result) => {
                if(err) return res.json(err);
                return res.json({Status: "success"});
            })
            console.log("successfully updated amazon id");
        } else {
            const sql2 = "INSERT INTO login (`firstName`, `email`, `id`) VALUES (?)";
            const values = [
                req.body.Name,
                req.body.PrimaryEmail,
                req.body.CustomerId,
            ]
            db.query(sql2, [values], (err, result) => {
                if(err) return res.json(err);
                return res.json({Status: "success"});
            })
            console.log("successfully added amazon user");
        }
    })
})

app.post('/register', (req, res) => {
    console.log('starting registeration');
    const sql = "INSERT INTO login (`firstName`, `lastName`, `email`, `password`) VALUES (?)";
    console.log("successfully registerun");
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if (err) return res.json(err);
        const values = [
            req.body.firstName,
            req.body.lastName,
            req.body.email,
            // req.body.password,
            hash
        ]
        db.query(sql, [values], (err, result) => {
            if(err) return res.json(err);
            return res.json({Status: "success"});
        })
    })
    
})

app.post('/auth/token', (req, res) => {
    console.log('starting account linking');
    console.log(req.body);
    const aclUrl = req.body.aclUrl;
    const url = 'https://api.amazonalexa.com/v1/users/~current/skills/amzn1.ask.skill.4372204c-a922-4cd9-a20c-1dd6ad55c8f6/enablement'
    const aclPayload = JSON.stringify(req.body.aclPayload);
    const headers = {
        'Authorization': 'Bearer ' + req.body.lwa_access_token,
        'Content-Type': "application/json;charset=UTF-8"
    };
    try {
        fetch(url, {method: 'POST', body: JSON.stringify(aclPayload), headers: headers}).then((res) => console.log(res));
        return res.json({Status: "account linking call success"})
    } catch (error) {
        console.log(error);
    }
    
})

app.get('/is-account-linked', (req, res) => {
    console.log("getting account linking status");
    const url = 'https://api.amazonalexa.com/v1/users/~current/skills/amzn1.ask.skill.4372204c-a922-4cd9-a20c-1dd6ad55c8f6/enablement'
    const headers = {
        'Authorization': 'Bearer ' + lwa_access_token,
        'Content-Type': "application/json;charset=UTF-8"
    };
    let data;
    try {
        fetch(url, {method: 'POST', body: JSON.stringify(aclPayload), headers: headers}).then((res) => data = res.json);
        return res.json({Status: "account linking call success", data: data});
    } catch (error) {
        console.log(error);
        return res.json({error: error, lwa_access_token: lwa_access_token});
    }

})

// abc@xyz.com
app.post('/login', (req, res) => {
    console.log('starting login');
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    // res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    const sql = "SELECT * FROM login WHERE email = ?";
    console.log(sql);
    db.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json(err);
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, passwordRes) => {
                if (passwordRes) {
                    const email = result[0].email;
                    const token = jwt.sign({email}, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({Status: "success"});
                } else {
                    return res.json(err);
                }
            });
        } else {
            return res.json(err);
        }
    })
    
})


app.get('/logout', (req, res) => {
    console.log('starting logout');
    res.clearCookie('token');
    res.clearCookie('lwatoken');
    return res.json({Status: "success"});
})

app.listen(8001, () => {
    console.log('listening on 8001...');
})