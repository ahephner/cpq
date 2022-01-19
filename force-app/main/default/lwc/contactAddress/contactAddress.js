import { LightningElement, api, wire, track } from 'lwc';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import SHIPID from '@salesforce/schema/Opportunity.Shipping_Address__c'
import {getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
export default class ContactAddress extends LightningElement {
        @api recordId; 
        customer;
        selected; 
       // @track selectObj;
        @track options;
        isRendered = false;   
        error;  

        @wire(getRecord, {recordId: '$recordId', fields:[ACCID, SHIPID]})
            custFields({data, error}){
                if(data){
                    this.customer = getFieldValue(data,ACCID);
                    this.findAddress(this.customer)
                    this.selected = getFieldValue(data, SHIPID);
                }else if(error){
                    this.error = error;
                }
            }

        findAddress(rec){
             getAddress({accID: rec})
                .then((res)=>{
                    console.log('1 options');
                    
                    this.options = res.map(item=>({
                                        ...item,
                                        label: item.Street +' ('+item.AddressType+')',
                                        value: item.Id
                    }))
                    console.log('type of options '+typeof this.options);
                    
                }).catch((error)=>{
                    this.error = error;
                    console.log('error  '+this.error);
                    
                }).finally(()=>{
                
                })
        }
//if a ship to has already been selected set that value
//note as of now it puts the same option twice in the drop downs. 
            get selectedObj(){
                let label;
                    if(this.options && this.selected){
                        label = this.options.find((x)=>x.value===this.selected)
                    }
                    
                    return label;
                
                
            }

           
        selectChange(event){
            let newValue = this.template.querySelector('.slds-select').value; 
            console.log(newValue)
        }
}