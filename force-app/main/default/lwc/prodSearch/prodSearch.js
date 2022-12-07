import { LightningElement, track, wire, api } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';
import { MessageContext, publish} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/Product2';
import SUB_CAT from '@salesforce/schema/Product2.Subcategory__c';
import PROD_FAM from '@salesforce/schema/Product2.Product_Family__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_lightning_ui_api_object_info */
//import spLoc from '@salesforce/apex/futureApex.spLoc';

export default class ProdSearch extends LightningElement {
    @api recordId; 
    @api priceBookId;
    @track openPricing = false;
    loaded  = false 
    @track prod = [];
    error;
    searchKey;
    pf = 'All';
    cat = 'All';
    productsSelected = 0; 
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];
    newProd; 
    @track columnsList = [
        {type: 'button-icon', 
         initialWidth: 75,typeAttributes:{
            iconName:{fieldName: 'rowName'}, 
            name: 'add prod' ,
            title: 'Add',
            disabled: false,
            value: {fieldName: 'rowValue'},
            variant: { fieldName: 'rowVariant' },
        }, 
        cellAttributes: {
            style: 'transform: scale(0.75)'}
        },
        {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}, "initialWidth": 625},
        {label: 'Code', fieldName:'ProductCode', cellAttributes:{alignment:'center'}, "initialWidth": 137},
        {label: 'Status', fieldName:'Status', cellAttributes:{alignment:'center'}, sortable: "true"},
        {label:'Floor Type', fieldName:'Floor', cellAttributes:{alignment:'center'}},
        {label: 'Floor Price', fieldName:'Floor_Price__c', 
        type:'currency', cellAttributes:{alignment:'center'}},
        {label:'Comp OH', fieldName:'qtyOnHand', cellAttributes:{alignment:'center'}}
    ]
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
       //console.log('searchKey '+this.searchKey);
       //console.log(1,this.searchKey, 2, this.cat, 3, this.pf, 4, this.priceBookId)
        searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf, priceBookId:this.priceBookId })
        .then((result) => {
           //can't use dot notation on native tables 
           //will use map next to do math on floor type. 
            this.prod = result.map(item =>({
                                 ...item, 
                                 rowVariant: item.Product2.Temp_Unavailable__c ? 'border-filled' : 'brand',
                                 rowName: item.Product2.Temp_Unavailable__c ? 'action:freeze_user' : 'action:new',
                                 rowValue: item.Product2.Temp_Unavailable__c ? 'unavailable' :'Add',
                                 Name: item.Product2.Temp_Unavailable__c ? item.Product2.Name + ' - ' +item.Product2.Temp_Mess__c : item.Product2.Name,  
                                 ProductCode: item.Product2.ProductCode,
                                 Status: item.Product2.Product_Status__c,
                                 Floor: item.Product2.Floor_Type__c,
                                 qtyOnHand: item.Product2.Total_Product_Items__c
                                }));
            // console.log('returned products');
            
            //console.log(JSON.stringify(this.prod));
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
        const rowAction = e.detail.row.rowValue; 
        const rowCode = e.detail.row.ProductCode;
        const rowName = e.detail.row.Name;
        const rowFloorPrice = e.detail.row.Floor_Price__c;
        const rowFloorCost = e.detail.row.Product_Cost__c;
        const rowLevelOne = e.detail.row.Level_1_UserView__c;
        const rowLevel1Margin = e.detail.row.Level_One_Margin__c;
        const rowLevelTwo = e.detail.row.Level_2_UserView__c;
        const rowLevel2Margin = e.detail.row.Level_2_Margin__c; 
        const rowProductId = e.detail.row.Product2Id;
        const rowId = e.detail.row.Id; 
        const rowAg = e.detail.row.Agency_Product__c;
        const rowWeight = e.detail.row.Product2.Ship_Weight__c;
        const rowLastPaid = e.detail.row.Product2.Last_Purchase_Price__c;
        const rowPalletQty = e.detail.row.Product2.Pallet_Qty__c;
        const rowSGN = e.detail.row.Product2.SGN__c; 
        const rowRUP = e.detail.row.RUP__c
        //const rowFormulaProdtect = e.detail.row.Level_1_Protection_Formula__c;
       // const rowFormula = e.detail.row.Level_1_Formula__c; 
        
        
        //get that row button so we can update it  
        let index = this.prod.find((item) => item.Id === rowId);
        //console.log('rowWeight '+rowWeight);
        
        
        if(rowAction === 'unavailable'){
            alert('Sorry ' + index.Product2.Temp_Mess__c)    
        }else if(rowAction ==='Add'){
                const payload = {
                    productCode: rowCode,
                    productId: rowProductId,
                    unitCost:rowFloorCost,  
                    floorPrice: rowFloorPrice,
                    levelOnePrice: rowLevelOne,
                    levelOneMargin: rowLevel1Margin,
                    levelTwoPrice: rowLevelTwo,
                    levelTwoMargin: rowLevel2Margin, 
                    productName: rowName,
                    pbeId: rowId,
                    agencyProduct: rowAg,
                    prodWeight: rowWeight,
                    lastPaid: rowLastPaid,
                    palletQty: rowPalletQty,
                    size: rowSGN,
                    rup: rowRUP 
                }
                      
    //send it 
           publish(this.messageContext, Opportunity_Builder, payload); 
    //update the button
            index.rowVariant = 'success';
            index.rowValue = 'Remove'
            index.rowName = 'action:check';
            this.prod= [...this.prod]
             
        }else if(rowAction === 'Remove'){
            this.productsSelected --;
            console.log('productsSelect '+this.productsSelected)
            const rowId = e.detail.row.Id;
            console.log('id '+ rowId);
            
            let index = this.prod.find((item) => item.Id === rowId);
            //update the button
            index.rowVariant = 'brand';
            index.rowValue = 'Add'
            index.rowName = 'action:new';
            this.prod= [...this.prod]

            this.dispatchEvent(new CustomEvent('removeprod',{
                detail: rowId
            }))
        }
    }
//This gets updated by the child appSelected with the id of a product that was selected
//it then sets a var as the idea finds the index then removes it from the array
handleRemove(x){
    //console.log('connected');
    const prodId = x.detail;
    //console.log('prodId '+ prodId);  
    const index = this.selection.findIndex(item => item.id === prodId);
    //console.log('index '+ index);
    this.selection.splice(index, 1);
    //console.log(this.selection);
    
}

//handle table sorting sorting
 //Grabbed this from a salesforce example
 handleSortdata(event) {
    // field name
    this.sortBy = event.detail.fieldName;

    // sort direction
    this.sortDirection = event.detail.sortDirection;

    // calling sortdata function to sort the data based on direction and selected field
    this.sortData(event.detail.fieldName, event.detail.sortDirection);
}

sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.prod));

    // Return the value stored in the field
    let keyValue = (a) => {
        return a[fieldname];
    };

    // cheking reverse direction 
    let isReverse = direction === 'asc' ? 1: -1;

    // sorting data 
    parseData.sort((x, y) => {
        x = keyValue(x) ? keyValue(x) : ''; // handling null values
        y = keyValue(y) ? keyValue(y) : '';

        // sorting values based on direction
        return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.prod = parseData;

}
}