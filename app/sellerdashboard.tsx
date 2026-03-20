import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SellerDashboard() {

const router = useRouter();

return (

<View style={styles.container}>

{/* HEADER */}

<View style={styles.header}>

<Text style={styles.title}>Seller Dashboard</Text>

<TouchableOpacity onPress={()=>router.push("/sellerlogin")}>
<Ionicons name="log-out-outline" size={26} color="#fff"/>
</TouchableOpacity>

</View>



<ScrollView contentContainerStyle={styles.content}>

<Text style={styles.welcome}>Welcome Seller 👋</Text>

<Text style={styles.subtitle}>
Manage your store, products, and orders easily.
</Text>



{/* DASHBOARD CARDS */}

<View style={styles.grid}>


{/* PRODUCTS */}

<TouchableOpacity style={styles.card}>

<Ionicons name="cube-outline" size={32} color="#ff7a00"/>

<Text style={styles.cardTitle}>Products</Text>

<Text style={styles.cardText}>Manage Products</Text>

</TouchableOpacity>



{/* ORDERS */}

<TouchableOpacity style={styles.card}>

<Ionicons name="cart-outline" size={32} color="#ff7a00"/>

<Text style={styles.cardTitle}>Orders</Text>

<Text style={styles.cardText}>View Orders</Text>

</TouchableOpacity>



{/* EARNINGS */}

<TouchableOpacity style={styles.card}>

<Ionicons name="wallet-outline" size={32} color="#ff7a00"/>

<Text style={styles.cardTitle}>Earnings</Text>

<Text style={styles.cardText}>Check Revenue</Text>

</TouchableOpacity>



{/* CUSTOMERS */}

<TouchableOpacity style={styles.card}>

<Ionicons name="people-outline" size={32} color="#ff7a00"/>

<Text style={styles.cardTitle}>Customers</Text>

<Text style={styles.cardText}>View Customers</Text>

</TouchableOpacity>


</View>



{/* QUICK ACTION */}

<TouchableOpacity style={styles.addProductBtn}>

<Ionicons name="add-circle-outline" size={20} color="#fff"/>

<Text style={styles.addProductText}> Add New Product</Text>

</TouchableOpacity>


</ScrollView>

</View>

);

}



const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f4f4f4"
},

header:{
backgroundColor:"#ff7a00",
padding:18,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

title:{
color:"#fff",
fontSize:20,
fontWeight:"700"
},

content:{
padding:20
},

welcome:{
fontSize:22,
fontWeight:"700",
marginBottom:5
},

subtitle:{
color:"#666",
marginBottom:20
},

grid:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"space-between"
},

card:{
width:"48%",
backgroundColor:"#fff",
padding:20,
borderRadius:12,
alignItems:"center",
marginBottom:15,
elevation:3
},

cardTitle:{
fontSize:16,
fontWeight:"700",
marginTop:8
},

cardText:{
color:"#666",
fontSize:13
},

addProductBtn:{
marginTop:10,
backgroundColor:"#ff7a00",
padding:15,
borderRadius:10,
flexDirection:"row",
justifyContent:"center",
alignItems:"center"
},

addProductText:{
color:"#fff",
fontWeight:"700",
fontSize:16
}

});