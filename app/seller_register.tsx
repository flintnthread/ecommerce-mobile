import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
TextInput,
TouchableOpacity,
ScrollView,
Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SellerRegister() {

const router = useRouter();

const [firstName,setFirstName]=useState("");
const [lastName,setLastName]=useState("");
const [mobile,setMobile]=useState("");
const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [confirmPassword,setConfirmPassword]=useState("");

const [showPassword,setShowPassword]=useState(false);
const [showConfirmPassword,setShowConfirmPassword]=useState(false);

const [agree,setAgree]=useState(false);

const [firstNameError,setFirstNameError]=useState("");
const [lastNameError,setLastNameError]=useState("");
const [mobileError,setMobileError]=useState("");
const [emailError,setEmailError]=useState("");
const [passwordError,setPasswordError]=useState("");
const [confirmPasswordError,setConfirmPasswordError]=useState("");
const [agreeError,setAgreeError]=useState("");



/* FIRST NAME VALIDATION */

const validateFirstName=(value)=>{

const nameRegex=/^[A-Za-z]+$/;

if(value.trim()==="")
{
setFirstNameError("First name is required");
return false;
}

if(!nameRegex.test(value))
{
setFirstNameError("Only letters allowed");
return false;
}

setFirstNameError("");
return true;

};



/* LAST NAME VALIDATION */

const validateLastName=(value)=>{

const nameRegex=/^[A-Za-z]+$/;

if(value.trim()==="")
{
setLastNameError("Last name is required");
return false;
}

if(!nameRegex.test(value))
{
setLastNameError("Only letters allowed");
return false;
}

setLastNameError("");
return true;

};



/* MOBILE VALIDATION */

const validateMobile=(value)=>{

const mobileRegex=/^[0-9]{10}$/;

if(value.trim()==="")
{
setMobileError("Mobile number is required");
return false;
}

if(!mobileRegex.test(value))
{
setMobileError("Enter valid 10 digit number");
return false;
}

setMobileError("");
return true;

};



/* EMAIL VALIDATION */

const validateEmail=(value)=>{

const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(value.trim()==="")
{
setEmailError("Email is required");
return false;
}

if(!emailRegex.test(value))
{
setEmailError("Enter valid email address");
return false;
}

setEmailError("");
return true;

};



/* PASSWORD VALIDATION */

const validatePassword=(value)=>{

if(value.trim()==="")
{
setPasswordError("Password is required");
return false;
}

if(value.length<6)
{
setPasswordError("Password must be at least 6 characters");
return false;
}

setPasswordError("");
return true;

};



/* CONFIRM PASSWORD */

const validateConfirmPassword=(value)=>{

if(value.trim()==="")
{
setConfirmPasswordError("Confirm your password");
return false;
}

if(value!==password)
{
setConfirmPasswordError("Passwords do not match");
return false;
}

setConfirmPasswordError("");
return true;

};



/* SEND OTP */

const handleSendOtp=()=>{

if(validateMobile(mobile))
{
alert("OTP Sent Successfully");
}

};



/* REGISTER */

const handleRegister=()=>{

const f=validateFirstName(firstName);
const l=validateLastName(lastName);
const m=validateMobile(mobile);
const e=validateEmail(email);
const p=validatePassword(password);
const c=validateConfirmPassword(confirmPassword);

if(!agree)
{
setAgreeError("You must agree to Terms & Privacy Policy");
return;
}
else
{
setAgreeError("");
}

if(f && l && m && e && p && c && agree)
{
router.push("/sellerdashboard");
}

};



return(

<View style={styles.container}>

<ScrollView>

<View style={styles.card}>

<Image
source={require("../assets/images/f&tlogoFull.png")}
style={styles.logo}
/>

<Text style={styles.title}>Seller Registration</Text>

<Text style={styles.subtitle}>
Create your seller account to start selling on our platform.
</Text>


{/* FIRST NAME */}

<Text style={styles.label}>FIRST NAME *</Text>

<TextInput
placeholder="Enter your first name"
style={[styles.input,firstNameError?styles.errorInput:null]}
value={firstName}
onChangeText={(text)=>{
setFirstName(text);
validateFirstName(text);
}}
/>

{firstNameError?<Text style={styles.errorText}>{firstNameError}</Text>:null}



{/* LAST NAME */}

<Text style={styles.label}>LAST NAME *</Text>

<TextInput
placeholder="Enter your last name"
style={[styles.input,lastNameError?styles.errorInput:null]}
value={lastName}
onChangeText={(text)=>{
setLastName(text);
validateLastName(text);
}}
/>

{lastNameError?<Text style={styles.errorText}>{lastNameError}</Text>:null}



{/* MOBILE */}

<Text style={styles.label}>MOBILE NUMBER *</Text>

<TextInput
placeholder="Enter your mobile number"
keyboardType="number-pad"
style={[styles.input,mobileError?styles.errorInput:null]}
value={mobile}
onChangeText={(text)=>{
setMobile(text);
validateMobile(text);
}}
/>

{mobileError?<Text style={styles.errorText}>{mobileError}</Text>:null}



<TouchableOpacity style={styles.otpBtn} onPress={handleSendOtp}>
<Text style={styles.otpText}>📱 Send OTP</Text>
</TouchableOpacity>



{/* EMAIL */}

<Text style={styles.label}>EMAIL ADDRESS *</Text>

<TextInput
placeholder="Enter your email address"
style={[styles.input,emailError?styles.errorInput:null]}
value={email}
onChangeText={(text)=>{
setEmail(text);
validateEmail(text);
}}
keyboardType="email-address"
/>

{emailError?<Text style={styles.errorText}>{emailError}</Text>:null}



{/* PASSWORD */}

<Text style={styles.label}>PASSWORD *</Text>

<View style={[styles.passwordBox,passwordError?styles.errorInput:null]}>

<TextInput
placeholder="Enter your password"
secureTextEntry={!showPassword}
style={{flex:1}}
value={password}
onChangeText={(text)=>{
setPassword(text);
validatePassword(text);
}}
/>

<TouchableOpacity onPress={()=>setShowPassword(!showPassword)}>
<Ionicons name={showPassword?"eye-off":"eye"} size={22} color="#555"/>
</TouchableOpacity>

</View>

{passwordError?<Text style={styles.errorText}>{passwordError}</Text>:null}



{/* CONFIRM PASSWORD */}

<Text style={styles.label}>CONFIRM PASSWORD *</Text>

<View style={[styles.passwordBox,confirmPasswordError?styles.errorInput:null]}>

<TextInput
placeholder="Confirm your password"
secureTextEntry={!showConfirmPassword}
style={{flex:1}}
value={confirmPassword}
onChangeText={(text)=>{
setConfirmPassword(text);
validateConfirmPassword(text);
}}
/>

<TouchableOpacity onPress={()=>setShowConfirmPassword(!showConfirmPassword)}>
<Ionicons name={showConfirmPassword?"eye-off":"eye"} size={22} color="#555"/>
</TouchableOpacity>

</View>

{confirmPasswordError?<Text style={styles.errorText}>{confirmPasswordError}</Text>:null}



{/* TERMS */}

<TouchableOpacity
style={styles.terms}
onPress={()=>setAgree(!agree)}
>

<View style={[styles.checkbox,agree&&styles.checkboxActive]}>
{agree && <Ionicons name="checkmark" size={14} color="#fff"/>}
</View>

<Text style={styles.termsText}>
I agree to the{" "}

<Text
style={styles.link}
onPress={()=>router.push("/terms_privacy")}
>
Terms and Conditions
</Text>

{" "}and{" "}

<Text
style={styles.link}
onPress={()=>router.push("/terms_privacy")}
>
Privacy Policy
</Text>

</Text>

</TouchableOpacity>

{agreeError?<Text style={styles.errorText}>{agreeError}</Text>:null}



{/* REGISTER */}

<TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
<Text style={styles.registerText}>REGISTER</Text>
</TouchableOpacity>


</View>

</ScrollView>

</View>

);

}



const styles=StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f3f3f3"
},

card:{
padding:20
},

logo:{
width:170,
height:70,
resizeMode:"contain",
alignSelf:"center"
},

title:{
fontSize:22,
fontWeight:"700",
textAlign:"center",
marginTop:10
},

subtitle:{
textAlign:"center",
color:"#666",
marginBottom:20
},

label:{
fontWeight:"600",
marginTop:10
},

input:{
borderWidth:1,
borderColor:"#ddd",
borderRadius:10,
padding:12,
marginTop:6,
backgroundColor:"#fff"
},

passwordBox:{
flexDirection:"row",
alignItems:"center",
borderWidth:1,
borderColor:"#ddd",
borderRadius:10,
paddingHorizontal:12,
marginTop:6,
backgroundColor:"#fff"
},

errorInput:{
borderColor:"red"
},

errorText:{
color:"red",
fontSize:12,
marginTop:4
},

otpBtn:{
backgroundColor:"#ff7a00",
padding:14,
borderRadius:10,
marginTop:10
},

otpText:{
color:"#fff",
textAlign:"center",
fontWeight:"600"
},

terms:{
flexDirection:"row",
alignItems:"center",
marginTop:15
},

checkbox:{
width:18,
height:18,
borderWidth:1,
borderColor:"#999",
marginRight:6,
justifyContent:"center",
alignItems:"center"
},

checkboxActive:{
backgroundColor:"#ff7a00",
borderColor:"#ff7a00"
},

termsText:{
flex:1,
color:"#555"
},

link:{
color:"#ff7a00",
fontWeight:"600"
},

registerBtn:{
backgroundColor:"#ff7a00",
padding:16,
borderRadius:10,
marginTop:20
},

registerText:{
color:"#fff",
textAlign:"center",
fontWeight:"700",
fontSize:16
}

});