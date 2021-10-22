//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import { APPLICATION_SCOPE,MessageContext, subscribe, unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import ACC from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';

const FIELDS = [ACC, STAGE];
export default class ProdSelected extends LightningElement {
    @api recordId;
    productId; //not the pbe the actual product id
    productCode;
    priceBookId;
    unitCost;
    productName; 
    prodFound = false
    accountId;
    stage;
    @track selection = []
//for message service
    subscritption = null;

    @wire(MessageContext)
    messageContext;
    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
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
        this.productId = mess.productId;
        this.unitCost = mess.unitPrice;
        this.handleNewProd(); 
        this.prodFound = true; 
    }
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
//get record values
    @wire(getRecord, {recordId: '$recordId', fields:[ACC, STAGE]})
        loadFields({data, error}){
            if(data){
                this.accountId = getFieldValue(data, ACC);
                this.stage = getFieldValue(data, STAGE);
                console.log('accid '+this.accountId);
            }else if(error){
                console.log('error '+JSON.stringify(error));
                
            }
        }
    async handleNewProd(){
        //console.log(this.accountId + 'account id');
        
        this.newProd = await getLastPaid({accountID: this.accountId, Code: this.productCode})
        if(this.newProd != null){
            console.log(this.newProd);
            
            this.selection = [
                ...this.selection, {
                    Id: this.productId,
                    name: this.productName,
                    code: this.productCode,
                    qty: 0,
                    Unit_Price__c:0,
                    Margin__c: 0,
                    unitCost: this.unitCost,
                    lastPaid: this.newProd.Unit_Price__c,
                    lastMarg: (this.newProd.Margin__c / 100),
                    Total_Price__c: 0
                }
            ]
        }else{
            this.selection = [
                ...this.selection, {
                    Id: this.productId,
                    name: this.productName,
                    code: this.productCode,
                    qty: 0,
                    Unit_Price__c: 0,
                    lastPaid: 0,
                    lastMarg: 0, 
                    Margin__c: 0,
                    unitCost: this.unitCost,
                    Total_Price__c: 0
                }
            ]
        }   this.selection.forEach(x => console.log(x))
         
    }
    //Handle Pricing change here
    lineTotal = (units, charge)=> (units * charge).toFixed(2);
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.Id === e.target.name)
        
        this.delay = setTimeout(()=>{
            this.selection[index].Unit_Price__c = e.detail.value;
            this.selection[index].Unit_Price__c = Number(this.selection[index].Unit_Price__c);
            
            if(this.selection[index].Unit_Price__c > 0){
                this.selection[index].Margin__c = Number((1 - (this.selection[index].unitCost /this.selection[index].Unit_Price__c))*100).toFixed(2)
                this.selection[index].Total_Price__c = (this.selection[index].qty * this.selection[index].Unit_Price__c).toFixed(2);
                console.log('tp '+this.selection[index].Total_Price__c);
                
            }
        }, 1000)
        
    }

    newMargin(m){
        window.clearTimeout(this.delay)
        let index = this.selection.findIndex(prod => prod.Id === m.target.name)
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delay = setTimeout(()=>{
                this.selection[index].Margin__c = Number(m.detail.value);
                if(1- this.selection[index].Margin__c/100 > 0){
                    this.selection[index].Unit_Price__c = Number(this.selection[index].unitCost /(1- this.selection[index].Margin__c/100)).toFixed(2);
                    this.selection[index].Total_Price__c = Number(this.selection[index].Units_Required__c * this.selection[index].Unit_Price__c).toFixed(2)
                    this.selection[index].Total_Price__c = this.lineTotal(this.selection[index].qty, this.selection[index].Unit_Price__c);                
                }else{
                    this.selection[index].Unit_Price__c = 0;
                    this.selection[index].Unit_Price__c = this.selection[index].Unit_Price__c.toFixed(2);
                    this.selection[index].Total_Price__c = Number(this.selection[index].Units_Required__c * this.selection[index].Unit_Price__c).toFixed(2)   
                 
                }
    },1500)
        
    }
    
    newQTY(e){
        let index = this.selection.findIndex(prod => prod.Id === e.target.name)
        this.selection[index].qty = Number(e.detail.value);
        if(this.selection[index].Unit_Price__c >0){
            this.selection[index].Total_Price__c = (this.selection[index].qty * this.selection[index].Unit_Price__c).toFixed(2); 
            console.log('qty change '+this.selection[index].Total_Price__c);
            
        }
    }
    removeProd(x){
        let index = this.selection.findIndex(prod => prod.Id === x.target.name)
        console.log('removeProd '+ index);
        
        if(index >= 0){
            let cf = confirm('Do you want to remove this entry?')
            if(cf ===true){
                this.selection.splice(index, 1);
            }
        }      
    }
}