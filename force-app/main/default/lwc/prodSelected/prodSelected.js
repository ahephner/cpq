//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getLastPaid from '@salesforce/apex/cpqApex.getLastPaid'; 
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';

export default class ProdSelected extends LightningElement {
    @api recordId;
    productId; //not the pbe the actual product id
    productCode;
    priceBookId;
    unitCost;
    prodFound = false
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
        this.priceBookId = mess.priceBookId; 
        this.productId = mess.productId;
        this.unitCost = mess.unitPrice;
        this.handleNewProd(); 
        this.prodFound = true; 
    }
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    async handleNewProd(){
        this.newProd = await getLastPaid({accountID: '0011D00000zhrrIQAQ', Code: this.productCode})
        if(this.newProd != null){
            console.log(this.newProd);
            
            this.selection = [
                ...this.selection, {
                    id: this.productId,
                    name: this.productCode,
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
                    id: this.productId,
                    name: this.productCode,
                    qyt: 0,
                    Unit_Price__c: 0,
                    lastPaid: 0,
                    lastMarg: 0, 
                    Margin__c: 0,
                    unitCost: this.unitCost,
                    Total_Price__c: 0
                }
            ]
        }   //this.selection.forEach(x => console.log(x))
         
    }
    //Handle Pricing change here
    lineTotal = (units, charge)=> (units * charge).toFixed(2);
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.Id === e.target.name)
        
        this.delay = setTimeout(()=>{
            this.selection[index].Unit_Price__c = e.detail.value;
            this.selection[index].Unit_Price__c = Number(this.selection[index].Unit_Price__c);
            console.log('unit Price '+this.selection[index].Unit_Price__c, typeof this.selection[index].Unit_Price__c);
            console.log('cost before  '+this.selection[index].unitCost,typeof this.selection[index].unitCost);
            
            
            if(this.selection[index].Unit_Price__c > 0){
                this.selection[index].Margin__c = Number((1 - (this.selection[index].unitCost /this.selection[index].Unit_Price__c))*100).toFixed(2)
                this.selection[index].Total_Price__c = this.lineTotal(this.selection[index].qty, this.selection[index].Unit_Price__c);
            }
        }, 1000)
        
    }

    newMargin(e){
        console.log('new Margin');
        
    }

    removeProd(x){
        let xId = x.target.name; 
        this.dispatchEvent(new CustomEvent('update', {
            detail: xId
        })); 
        //console.log('selected id '+ xId);
        
    }
}