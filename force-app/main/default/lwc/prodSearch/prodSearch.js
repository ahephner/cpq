import { LightningElement, track, wire, api } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';
import { MessageContext, publish} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/Product2';
import SUB_CAT from '@salesforce/schema/Product2.Subcategory__c';
import PROD_FAM from '@salesforce/schema/Product2.Product_Family__c'
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_lightning_ui_api_object_info */
//import spLoc from '@salesforce/apex/futureApex.spLoc';
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
    {label: 'Status', fieldName:'Status', cellAttributes:{alignment:'center'}},
    {label:'Floor Type', fieldName:'Floor', cellAttributes:{alignment:'center'}},
    {label: 'List Price', fieldName:'UnitPrice', 
    type:'currency', cellAttributes:{alignment:'center'}},
    {label:'Comp OH', fieldName:'qtyOnHand', cellAttributes:{alignment:'center'}}
]
export default class ProdSearch extends LightningElement {
    @api recordId; 
    @api priceBookId;
    @track openPricing = false;
    loaded  = false
    columnsList = columnsList; 
    prod;
    error;
    searchKey;
    pf = 'All';
    cat = 'All';
    productsSelected = 0; 
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];
    newProd; 
    
    @api
    openPriceScreen(){
        this.openPricing = true;
        this.loaded = true;  
    }

    closePriceScreen(){
        this.productsSelected = 0; 
        this.openPricing = false; 
    }
    //Subscribe to Message Channel
    @wire(MessageContext)
    messageContext; 
    //need this to get picklist
    @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
    objectInfo;
    //get sub category picklist
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: SUB_CAT
      })
      subCatValues;
      //get product family picklist
      @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: PROD_FAM
      })
      pfValues;

    nameChange(event){
        this.searchKey = event.target.value.trim().toLowerCase();
        
      }

      //handle enter key tagged. maybe change to this.searhKey === undefined
      handleKey(evt){
          console.log('pf '+this.pf+' cat '+this.cat);
          
          if(!this.searchKey){
              //console.log('sk '+this.searchKey);
              return;
          }
          if(evt.key === 'Enter')
              this.search();  
      }
      pfChange(event){
          this.pf = event.detail.value; 
          console.log('pf '+this.pf);
          
      }
  
      catChange(e){
          this.cat = e.detail.value; 
          console.log('cat '+this.cat);
      }

//search for product
      search(){
        this.loaded = false; 
       console.log('searchKey '+this.searchKey);
       
        searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf, priceBookId:this.priceBookId })
        .then((result) => {
           //can't use dot notation on native tables 
           //will use map next to do math on floor type. 
            result.forEach(x =>{
                x.Name = x.Product2.Name,
                x.ProductCode = x.Product2.ProductCode,
                x.Status = x.Product2.Product_Status__c,
                x.Floor = x.Product2.Floor_Type__c,
                x.qtyOnHand = x.Product2.Total_Product_Items__c
            })
            this.prod = result;
            console.log(JSON.stringify(this.prod));
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
        this.productsSelected ++; 
        const rowAction = e.detail.action.name; 
        const rowCode = e.detail.row.ProductCode;
        const rowName = e.detail.row.Name;
        const rowUPrice = e.detail.row.UnitPrice; 
        const rowProductId = e.detail.row.Product2Id;
        const rowId = e.detail.row.Id; 
        const rowAg = e.detail.row.Product2.Agency__c
        
        
        
        if(rowAction ==='Add'){
             const payload = {
                 productCode: rowCode,
                 productId: rowProductId, 
                 unitPrice: rowUPrice,
                 productName: rowName,
                 pbeId: rowId,
                 agencyProduct: rowAg
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