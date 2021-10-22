import { LightningElement, track, wire, api } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';
import { MessageContext, publish} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import PRICE_BOOK from '@salesforce/schema/Opportunity.Pricebook2Id'; 
const columnsList = [
    {type: 'button', 
     initialWidth: 75,typeAttributes:{
        label: 'Add',
        name: 'Add',
        title: 'Add',
        disabled: false,
        value: 'add',
        variant: 'success'
    }, 
    cellAttributes: {
        style: 'transform: scale(0.75)'}
    },
    {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}},
    {label: 'Code', fieldName:'ProductCode', cellAttributes:{alignment:'center'}},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}},
    {label:'Floor Type', fieldName:'Floor', cellAttributes:{alignment:'center'}},
    {label: 'Avg Cost', fieldName:'UnitPrice', 
    type:'currency', cellAttributes:{alignment:'center'}},
]
export default class ProdSearch extends LightningElement {
    @api recordId; 
    priceBookId;
    @track loaded = false;
    columnsList = columnsList; 
    prod;
    error;
    searchKey;
    pf = 'All';
    cat = 'All';
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];
    newProd; 
    connectedCallback(){
        this.loaded = true; 
    }

    @wire(getRecord,{recordId:'$recordId', fields:[PRICE_BOOK]})
        loadFields({data, error}){
            if(data){
                this.priceBookId = getFieldValue(data,PRICE_BOOK);
            }else if(error){
                let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
                console.log(message); 
            }
        }
    //Subscribe to Message Channel
    @wire(MessageContext)
    messageContext; 
    //get set new product family/category search we will get dynamic in a later time
    get pfOptions(){
        return [
            {label: 'All', value:'All'}, 
            {label: 'Foliar-Pak', value:'Foliar-Pak'},
            {label: 'BASF', value:'BASF'}, 
            {label: 'FMC', value:'FMC'}
        ]
    }
    get catOptions(){
        return [
            {label: 'All', value: 'All'}, 
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
        ]
    }

    nameChange(event){
        this.searchKey = event.target.value.toLowerCase();
        console.log('pb id ' +this.priceBookId);
      }

      //handle enter key tagged. maybe change to this.searhKey === undefined
      handleKey(evt){
          if(!this.searchKey){
              //console.log('sk '+this.searchKey);
              return;
          }
          if(evt.key === 'Enter')
              this.search();  
      }
      pfChange(event){
          this.pf = event.detail.value; 
      }
  
      catChange(e){
          this.cat = e.detail.value; 
      }

//search for product
      search(){
        this.loaded = false; 
       
        searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf, priceBookId:this.priceBookId })
        .then((result) => {
           //can't use dot notation on native tables 
           //will use map next to do math on floor type. 
            result.forEach(x =>{
                x.Name = x.Product2.Name,
                x.ProductCode = x.Product2.ProductCode,
                x.Status = x.Product2.Product_Status__c,
                x.Floor = x.Product2.Floor_Type__c
            })
            this.prod = result;
            console.log(this.prod)
            this.error = undefined;
            
        })
        .catch((error) => {
            this.error = error;
            console.log(this.error);
            
        })
        .finally(() => {
            this.searchKey = undefined; 
            this.loaded = true; 
        })
        
      }
   
     doneLoad(){
         window.clearTimeout(this.delay); 
         this.delay = setTimeout(()=>{
             this.loaded = true; 
         },2000)
     }
     //Handles adding the products to this.Selection array when the green add button is hit on the product table
     handleRowAction(e){
        const rowAction = e.detail.action.name; 
        const rowCode = e.detail.row.ProductCode;
        const rowName = e.detail.row.Name;
        const rowUPrice = e.detail.row.UnitPrice; 
        const rowId = e.detail.row.Id;
    
        
        if(rowAction ==='Add'){
             const payload = {
                 productCode: rowCode,
                 productId: rowId, 
                 unitPrice: rowUPrice,
                 productName: rowName
             }         
    //send it 
            publish(this.messageContext, Opportunity_Builder, payload); 
        }
    }
//This gets updated by the child appSelected with the id of a product that was selected
//it then sets a var as the idea finds the index then removes it from the array
handleRemove(x){
    //console.log('connected');
    const prodId = x.detail;
    console.log('prodId '+ prodId);  
    const index = this.selection.findIndex(item => item.id === prodId);
    console.log('index '+ index);
    this.selection.splice(index, 1);
    //console.log(this.selection);
    
}
}