import { LightningElement, api, wire } from 'lwc';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import {getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
export default class ContactAddress extends LightningElement {
        @api recordId; 
        customer;
        values;
        options;  
        error;  
        @wire(getRecord, {recordId: '$recordId', fields:[ACCID]})
            custFields({data, error}){
                if(data){
                    this.customer = getFieldValue(data,ACCID);
                    
                    
                    this.findAddress(this.customer)
                }else if(error){
                    this.error = error;
                }
            }

        findAddress(rec){
             getAddress({accID: rec})
                .then((res)=>{
                    this.values = res
                    console.log(JSON.stringify(this.values));
                }).catch((error)=>{
                    this.error = error;
                    console.log('error  '+this.error);
                    
                })
        }
}