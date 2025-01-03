import 'dotenv/config'
import mongoose, {model, Schema} from 'mongoose';

const DB_URL = process.env.DB_URL;

mongoose.connect(DB_URL as string);

const userSchema = new Schema({
    username: {type: String, unique: true},
    password: String
})


export const userModal = model('User', userSchema);

const contentSchema = new Schema({
    title: String,
    link: String,
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true} ,

    
})


export const contentModal = model('Content', contentSchema);