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
    priceBookId
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
        console.log('listening');
        
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
                    lastPaid: this.newProd.Unit_Price__c,
                    lastMarg: this.newProd.Margin__c
                }
            ]
        }else{
            this.selection = [
                ...this.selection, {
                    id: this.productId,
                    name: this.productCode,
                    lastPaid: 0,
                    lastMarg: 0
                }
            ]
        }    
    }
    
    removeProd(x){
        let xId = x.target.name; 
        this.dispatchEvent(new CustomEvent('update', {
            detail: xId
        })); 
        //console.log('selected id '+ xId);
        
    }
}