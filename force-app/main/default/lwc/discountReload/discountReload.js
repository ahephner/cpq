import { LightningElement, wire } from 'lwc';
import { FlowNavigationFinishEvent } from 'lightning/flowSupport';
import { MessageContext, publish} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
export default class DiscountReload extends LightningElement {
    
        //Subscribe to Message Channel
        @wire(MessageContext)
        messageContext; 
    
    connectedCallback(){
        this.handleNext(); 
    }
    
   async handleNext(){
        const payLoad = {newDiscount: true};
        let pub = await publish(this.messageContext,Opportunity_Builder, payLoad);
        const finish = FlowNavigationFinishEvent();
        try{
            this.dispatchEvent(finish);

        }catch(error){
            console.error(error);
            
        }
    }


}