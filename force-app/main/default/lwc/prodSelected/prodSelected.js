//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import getInventory from '@salesforce/apex/cpqApex.getInventory';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe,  unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import ACC from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PRICE_BOOK from '@salesforce/schema/Opportunity.Pricebook2Id'; 
import WAREHOUSE from '@salesforce/schema/Opportunity.Warehouse__c'
import {mergeInv,mergeLastPaid, lineTotal, onLoadProducts} from 'c/helper'
const FIELDS = [ACC, STAGE, WAREHOUSE];
export default class ProdSelected extends LightningElement {
    @api recordId;
    pbeId; 
    productId; 
    productCode;
    pbId;
    unitCost;
    agency
    sId; 
    productName; 
    prodFound = false
    accountId;
    stage;
    warehouse;
    invCount;
    error;  
    loaded = true; 
    @track selection = []
//for message service
    subscritption = null;

    @wire(MessageContext)
    messageContext;
    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
        this.loadProducts(); 
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
    //subscribe to channel
    subscribeToMessageChannel(){
        
        if(!this.subscritption){
            this.subscritption = subscribe(
                this.messageContext,
                Opportunity_Builder,
                (message) => this.handleMessage(message),
                {scope:APPLICATION_SCOPE}
            );
        }
    }
    
    handleMessage(mess){
        this.productCode = mess.productCode;
        this.productName = mess.productName;
        this.productId = mess.productId 
        this.pbeId = mess.pbeId;
        this.unitCost = mess.unitPrice;
        this.agency = mess.agencyProduct;
        this.handleNewProd(); 
        this.prodFound = true; 
    
    }
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
//get record values
    @wire(getRecord, {recordId: '$recordId', fields:[ACC, STAGE, PRICE_BOOK, WAREHOUSE]})
        loadFields({data, error}){
            if(data){
                this.accountId = getFieldValue(data, ACC);
                this.stage = getFieldValue(data, STAGE);
                this.pbId = getFieldValue(data, PRICE_BOOK); 
                this.warehouse = getFieldValue(data, WAREHOUSE); 
                
            }else if(error){
                console.log('error '+JSON.stringify(error));
                
            }
        }
    async handleNewProd(){
        //get last paid only works on new adding product
        this.newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
        this.invCount = await getInventory({locId: this.warehouse, pId: this.productId })
        
        if(this.newProd != null){

            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    Id: '',
                    PricebookEntryId: this.pbeId,
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.unitCost: 0,
                    CPQ_Margin__c: this.agency?'':0,
                    Cost__c: this.unitCost,
                    lastPaid: !this.newProd ? 0 : this.newProd.Unit_Price__c,
                    lastMarg: this.agency ? '' : (this.newProd.Margin__c / 100),
                    docDate: this.newProd.Doc_Date__c,
                    TotalPrice: 0,
                    wInv:  !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    OpportunityId: this.recordId
                }
            ]
        }else{
            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    PricebookEntryId: this.pbeId,
                    Id: undefined,
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.unitCost: 0,
                    lastPaid: 0,
                    lastMarg: 0, 
                    CPQ_Margin__c: this.agency?'':0,
                    Cost__c: this.unitCost,
                    TotalPrice: 0,
                    wInv: !this.invCount ? 0 :this.invCount.QuantityOnHand,
                    OpportunityId: this.recordId
                }
            ]
        }   
         
    }
    //Handle Pricing change here
    
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        
        this.delay = setTimeout(()=>{
            this.selection[index].UnitPrice = e.detail.value;
            this.selection[index].UnitPrice = Number(this.selection[index].UnitPrice);
            
            if(this.selection[index].UnitPrice > 0){
                this.selection[index].CPQ_Margin__c = Number((1 - (this.selection[index].Cost__c /this.selection[index].UnitPrice))*100).toFixed(2)
                this.selection[index].TotalPrice = (this.selection[index].Quantity * this.selection[index].UnitPrice).toFixed(2);
                console.log('tp '+this.selection[index].TotalPrice);
                
            }
        }, 1000)
        
    }

    newMargin(m){
        window.clearTimeout(this.delay)
        let index = this.selection.findIndex(prod => prod.ProductCode === m.target.name)
        console.log('margin index '+index);
        
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delay = setTimeout(()=>{
                this.selection[index].CPQ_Margin__c = Number(m.detail.value);
                console.log('new margin value '+this.selection[index].CPQ_Margin__c)
                console.log('type of '+ typeof this.selection[index].CPQ_Margin__c );
                
                if(1- this.selection[index].CPQ_Margin__c/100 > 0){
                    this.selection[index].UnitPrice = Number(this.selection[index].Cost__c /(1- this.selection[index].CPQ_Margin__c/100)).toFixed(2);
                    console.log('cost '+this.selection[index].Cost__c);
                    
                    console.log('margin cal '+(1- this.selection[index].CPQ_Margin__c/100))
                    
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)
                    this.selection[index].TotalPrice = lineTotal(this.selection[index].Quantity, this.selection[index].UnitPrice);                
                }else{
                    this.selection[index].UnitPrice = 0;
                    this.selection[index].UnitPrice = this.selection[index].UnitPrice.toFixed(2);
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)   
                 
                }
    },1000)
        
    }
    
    newQTY(e){
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        console.log('index '+index);
        
        this.selection[index].Quantity = Number(e.detail.value);
        if(this.selection[index].UnitPrice >0){
            this.selection[index].TotalPrice = (this.selection[index].Quantity * this.selection[index].UnitPrice).toFixed(2); 
            console.log('qty change '+this.selection[index].TotalPrice);
            
        }
    }
    removeProd(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name)
        let id = this.selection[index].Id; 
        
        if(index >= 0){
            let cf = confirm('Do you want to remove this entry?')
            if(cf ===true){
                this.selection.splice(index, 1);
                if(id != undefined){
                    console.log('deleting prod');
                    
                    deleteRecord(id); 
                }
            }
        }      
    }

    //Save Products
    saveProducts(){
        this.loaded = false; 
        console.log('sending '+JSON.stringify(this.selection))
        createProducts({olList: this.selection})
        .then(result=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: result,
                    message: 'Products Saved',
                    variant: 'success',
                }),
            );
        }).catch(error=>{
            console.log(JSON.stringify(error))
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading contact',
                    message,
                    variant: 'error',
                }),
            );
        }).finally(()=>{
            this.loaded = true; 
        })
    }

;
    //on load get products
    //get last paid next
    async loadProducts(){
        //inventory vars
        let inSet = new Set();
        let prodIdInv = []; 
        let inCode = new Set();
        let codes = [];
        try{
            let results = await getProducts({oppId: this.recordId})
            if(!results){
                return; 
            }else if(results){

                results.forEach(item =>{
                    inSet.add(item.Product2Id);
                    inCode.add(item.Product2.ProductCode)
                });
                prodIdInv = [...inSet];
                
                codes = [...inCode]; 
            }
            //console.log('results '+JSON.stringify(results));
            
            let invenCheck = await onLoadGetInventory({locId: this.warehouse, pIds: prodIdInv});
            //console.log('invCheck '+JSON.stringify(invenCheck));
            
            
            let lastPaid = await onLoadGetLastPaid({accountId: this.accountId, productCodes:codes})
            //console.log('lp '+JSON.stringify(lastPaid));
            
            //MERGE the inventory and saved products. 
            let mergedInven = await mergeInv(results,invenCheck);
            //merge last paid saved products
            let mergedLastPaid = await mergeLastPaid(mergedInven,lastPaid);            
            
            //IF THERE IS A PROBLEM NEED TO HANDLE THAT STILL!!!
            this.selection = await onLoadProducts(mergedLastPaid, this.recordId); 
                //console.log('selection '+JSON.stringify(mergedLastPaid));

            mergedLastPaid.forEach(x=> 
                console.log('Product: '+x.Product2.Name+' doc name '+x.Name+' doc date '+x.Doc_Date__c)
            )
            
         }catch(error){
            let mess = error; 
            console.log('error ==> '+error);
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading products',
                    message: mess,
                    variant: 'error',
                }),
            );
            
        }finally{
            this.prodFound = true; 
        }

            // .then(result=>{
            //     result.forEach(item => { 
            //         console.log('map '+item.Product2Id)
            //         getInNoDup.add(item.Product2Id) 
            //         getPaid.add(item.Product2.ProductCode)
            //     });
            //     getIn = [...getInNoDup] 
            //     console.log('first then '+JSON.stringify(getIn));
                
            //     if(result){
            //         this.prodFound = true; 
            //         //result.forEach(x=>console.log(JSON.stringify(x)))
            //         this.selection  = result.map(x =>{
    
            //                                     return   {
            //                                                 sObjectType: 'OpportunityLineItem',
            //                                                 Id: x.Id,
            //                                                 PricebookEntryId: x.PricebookEntryId,
            //                                                 Product2Id: x.Product2Id,
            //                                                 name: x.Product2.Name,
            //                                                 ProductCode: x.Product2.ProductCode,
            //                                                 Quantity: x.Quantity,
            //                                                 UnitPrice:x.UnitPrice,
            //                                                 CPQ_Margin__c: x.Product2.Agency__c? '' : x.CPQ_Margin__c,
            //                                                 Cost__c: x.Cost__c,
            //                                                 agency: x.Product2.Agency__c,
            //                                                 //lastPaid: this.newProd.Unit_Price__c,
            //                                                 //lastMarg: (this.newProd.Margin__c / 100),
            //                                                 TotalPrice: x.TotalPrice,
            //                                                 OpportunityId: this.recordId
            //                                             }
            //                                             });
            //     }
                
            // })
    }
    //open price book search
    openProdSearch(){
        this.template.querySelector('c-prod-search').openPriceScreen(); 
    }
}