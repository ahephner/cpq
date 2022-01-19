import { LightningElement, api, wire, track } from 'lwc';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import SHIPID from '@salesforce/schema/Opportunity.Shipping_Address__c'
import {getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
export default class ContactAddress extends LightningElement {
        @api recordId; 
        customer;
       // @track selectObj;
        @track options;
        isRendered = false;   
        error;  
        get selectObj(){
            console.log('get');
            if(this.options.length > 0){
                
                return (this.options[0])
            }
        }
        @wire(getRecord, {recordId: '$recordId', fields:[ACCID, SHIPID]})
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
                    this.options = res.map(item=>({
                                        ...item,
                                        label: item.Street +' ('+item.AddressType+')',
                                        value: item.Id
                    }))
                }).catch((error)=>{
                    this.error = error;
                    console.log('error  '+this.error);
                    
                }).finally(()=>{
                
                })
        }
        handleChange(event){
            this.selectedObj = event.detail.value
            console.log('this.values type '+typeof this.selectedObj);
            
        }
        selectChange(event){
            let newValue = this.template.querySelector('.slds-select').value; 
            console.log(newValue)
        }
}