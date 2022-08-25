import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import OBJ from '@salesforce/schema/Opportunity'
import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import BILL_HOLD from '@salesforce/schema/Opportunity.BH_Yes_No__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c'
//import INV_DATE from '@salesforce/schema/Opportunity.Invoice_Date__c'
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c';
import DISCOUNT_PERCENT from '@salesforce/schema/Opportunity.Discount_Percentage__c';
const FIELDS = [EOP_PAYTYPE, FIRST_DATE, NUM_PAYMENTS, BILL_HOLD, DISCOUNT_PERCENT ]; 
export default class OppDetailsHeader extends LightningElement{
      
    @api recordId;
    @api objectApiName;
    @api prop1;
    recType;
    pt; 
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
        wiredResult({error, data}){
            if (error) {
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
            } else if (data) {
                this.recType = data.recordTypeId; 
                this.pt = getFieldValue(data, EOP_PAYTYPE); 
                console.log(this.pt); 
            }
        }
    @wire(getPicklistValues,{recordTypeId: '$recType', fieldApiName: EOP_PAYTYPE})
        wireValues({error, data}){
            if(data){
                console.log(data);
            }
        }

        payTypeChange(ev){
            console.log(ev)
        }
    handleSuccess(){
        console.log('good save!');
        
    }
}