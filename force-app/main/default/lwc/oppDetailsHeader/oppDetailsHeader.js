import { LightningElement, api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import ACC_ID from '@salesforce/schema/Opportunity.AccountId';
import SALES_REP from '@salesforce/schema/Opportunity.Sales_Rep__c';
import AMOUNT from '@salesforce/schema/Opportunity.Amount'
import STAGE from '@salesforce/schema/Opportunity.StageName'
import CLOSE from '@salesforce/schema/Opportunity.CloseDate'
import PO from '@salesforce/schema/Opportunity.Customer_PO__c'
import CONTACT from '@salesforce/schema/Opportunity.Contact__c'

export default class OppDetailsHeader extends LightningElement{
    @api recordId;
    @api objectApiName;
    fields = [NAME_FIELD, ACC_ID, SALES_REP, AMOUNT, STAGE, CLOSE, PO, CONTACT]
    handleSuccess(){
        console.log('good save!');
        
    }
}