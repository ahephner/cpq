//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe,  unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import ACC from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PRICE_BOOK from '@salesforce/schema/Opportunity.Pricebook2Id'; 
const FIELDS = [ACC, STAGE];
export default class ProdSelected extends LightningElement {
    @api recordId;
    pbeId; 
    productId; 
    productCode;
    pbId;
    unitCost;
    sId; 
    productName; 
    prodFound = false
    accountId;
    stage;
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
        this.handleNewProd(); 
        this.prodFound = true; 

    }
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
//get record values
    @wire(getRecord, {recordId: '$recordId', fields:[ACC, STAGE, PRICE_BOOK]})
        loadFields({data, error}){
            if(data){
                this.accountId = getFieldValue(data, ACC);
                this.stage = getFieldValue(data, STAGE);
                this.pbId = getFieldValue(data, PRICE_BOOK); 
                
            }else if(error){
                console.log('error '+JSON.stringify(error));
                
            }
        }
    async handleNewProd(){
        this.newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
        if(this.newProd != null){
            //console.log(this.newProd);
            
            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    Id: '',
                    PricebookEntryId: this.pbeId,
                    Product2Id: this.productId,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 0,
                    UnitPrice:0,
                    Margin_Percent__c: 0,
                    Cost__c: this.unitCost,
                    lastPaid: this.newProd.Unit_Price__c,
                    lastMarg: (this.newProd.Margin__c / 100),
                    TotalPrice: 0,
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
                    name: this.productName,
                    ProductCode: this.productCode,
                    Quantity: 0,
                    UnitPrice: 0,
                    lastPaid: 0,
                    lastMarg: 0, 
                    Margin_Percent__c: 0,
                    Cost__c: this.unitCost,
                    TotalPrice: 0,
                    OpportunityId: this.recordId
                }
            ]
        }   this.selection.forEach(x => console.log(x))
         
    }
    //Handle Pricing change here
    lineTotal = (units, charge)=> (units * charge).toFixed(2);
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        
        this.delay = setTimeout(()=>{
            this.selection[index].UnitPrice = e.detail.value;
            this.selection[index].UnitPrice = Number(this.selection[index].UnitPrice);
            
            if(this.selection[index].UnitPrice > 0){
                this.selection[index].Margin_Percent__c = Number((1 - (this.selection[index].Cost__c /this.selection[index].UnitPrice))*100).toFixed(2)
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
                this.selection[index].Margin_Percent__c = Number(m.detail.value);
                console.log('new margin value '+this.selection[index].Margin_Percent__c)
                console.log('type of '+ typeof this.selection[index].Margin_Percent__c );
                
                if(1- this.selection[index].Margin_Percent__c/100 > 0){
                    this.selection[index].UnitPrice = Number(this.selection[index].Cost__c /(1- this.selection[index].Margin_Percent__c/100)).toFixed(2);
                    console.log('cost '+this.selection[index].Cost__c);
                    
                    console.log('margin cal '+(1- this.selection[index].Margin_Percent__c/100))
                    
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)
                    this.selection[index].TotalPrice = this.lineTotal(this.selection[index].Quantity, this.selection[index].UnitPrice);                
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
            this.selection = result; 
        }).then(()=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
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
    //on load get products
    loadProducts(){
        getProducts({oppId: this.recordId})
            .then(result=>{
                if(result){
                    this.prodFound = true; 
                    //result.forEach(x=>console.log(x))
                    this.selection  = result.map(x =>{
    
                                                return   {
                                                            sObjectType: 'OpportunityLineItem',
                                                            Id: x.Id,
                                                            PricebookEntryId: x.PricebookEntryId,
                                                            Product2Id: x.Product2Id,
                                                            name: x.Product2.Name,
                                                            ProductCode: x.Product2.ProductCode,
                                                            Quantity: x.Quantity,
                                                            UnitPrice:x.UnitPrice,
                                                            Margin_Percent__c: x.Margin_Percent__c,
                                                            Cost__c: x.Cost__c,
                                                            //lastPaid: this.newProd.Unit_Price__c,
                                                            //lastMarg: (this.newProd.Margin__c / 100),
                                                            TotalPrice: x.TotalPrice,
                                                            OpportunityId: this.recordId
                                                        }
                                                        });
                }
                
            })
    }
    //open price book search
    openProdSearch(){
        this.template.querySelector('c-prod-search').openPriceScreen(); 
    }
}