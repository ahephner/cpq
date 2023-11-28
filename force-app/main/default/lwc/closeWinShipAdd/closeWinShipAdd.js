import { LightningElement, api } from 'lwc';
import OBJ from '@salesforce/schema/ContactPointAddress';
import NAME from '@salesforce/schema/ContactPointAddress.Name';
import PARENT from '@salesforce/schema/ContactPointAddress.ParentId';
import PICKUP from '@salesforce/schema/ContactPointAddress.New_Address__c';
import STREET from '@salesforce/schema/ContactPointAddress.Street';
import CITY from '@salesforce/schema/ContactPointAddress.City';
import STATE from '@salesforce/schema/ContactPointAddress.State';
import ZIP from '@salesforce/schema/ContactPointAddress.PostalCode';
import { createRecord  } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class CloseWinShipAdd extends LightningElement {
    @api accId
        msg = 'Adding an address can slow quote acceptance by up to 10 mins in the system'
        showAddress=false;
        returnedId; 
        name 
        parent  
        street 
        state 
        city 
        zip 
        valid
                //runs on change of the address. bit overkill but it's how the component comes
                handleChange(event){
                    this.street = event.target.street;
                    this.city = event.target.city;
                    this.zip = event.target.postalCode;
                    this.state =event.target.province;
                    this.valid = event.target.valid; 
                }
        
                //get new name for address
                newName(e){
                    this.name = e.detail.value; 
                }
                //checks to make sure all the needed fields are filled in. Need to add some more prompts in the future
                validInfo(){
                    const addName = this.template.querySelector('lightning-input');
                    const addFields = this.template.querySelector('lightning-input-address');
                    const addNameValid = addName.checkValidity();
                    const addFieldsValid = addFields.checkValidity();
                        if(addNameValid && addFieldsValid){
                            return true; 
                        }else{
                            return false; 
                            
                        }
                }
        //adds new address to system. First checks that the info is valid by calling above function
        //then if true sets the fields valuees and puts the fields with the object api name into an object => Api name and fields need to be imported above
        //then uses native createRecord and sets the returned id to a variable that it is passed along with the address name to a dispatch back to contactAddress
        //finally show toast its good. 
            saveNewAddress(){
                    let valid = this.validInfo();
                    if(valid){
                        const fields = {};
        
                        fields[NAME.fieldApiName] = this.name;
                        fields[PARENT.fieldApiName] = this.accId;
                        fields[STREET.fieldApiName] = this.street;
                        fields[STATE.fieldApiName] = this.state;
                        fields[CITY.fieldApiName] = this.city;
                        fields[ZIP.fieldApiName] = this.zip;
                        fields[PICKUP.fieldApiName] = true;
        
                        const recordInput = {apiName: OBJ.objectApiName, fields: fields}
        
                        createRecord(recordInput)
                        .then((res)=>{
                            this.returnedId = res.id; 
                            //console.log(JSON.stringify(res))
                            let addValues = {value: this.returnedId, label: this.street + ' ('+ this.name+')'};
                            //console.log(2, addValues);
                            
                            
                            const updateList = new CustomEvent("newaddress", {detail:addValues});
                            this.dispatchEvent(updateList);
                            //console.log(3);
                            
                            
                        }).then(a =>{
                            const evt = new ShowToastEvent({
                                title: 'Address Added',
                                message: this.msg,
                                variant: 'success'
                            });
                            this.dispatchEvent(evt);
                            
                            //console.log(4);
                            
                            this.name = '';
                            this.street = '';
                            this.state = '';
                            this.city = '';
                            this.zip = ''; 
                        }).catch((err)=>{
                            let error = JSON.stringify(err)
                            const evt = new ShowToastEvent({
                                title: 'Error',
                                message: error,
                                variant: 'error'
                            });
                            this.dispatchEvent(evt);
                        })
        
                    }else{
                        console.log('bad address');
                    }
                    
                }
        cancelAddress(){ 
            const back = new CustomEvent("closeadd", {detail:'close'});
                            this.dispatchEvent(back);
        }
        _country = 'US';
        countryProvinceMap = {
            US: [
            { value: 'Alabama',label: 'AL' },
            { value: 'Alaska', label: 'AK' },
            { value: 'Arizona', label: 'AZ' },
            { value: 'Arkansas', label: 'AR' },
            { value: 'California', label: 'CA' },
            { value: 'Colorado', label: 'CO' },
            { value: 'Connecticut', label: 'CT' },
            { value: 'Delaware', label: 'DE' },
            { value: 'Florida', label: 'FL' },
            { value: 'Georgia', label: 'GA' },
            { value: 'Hawaii', label: 'HI' },
            { value: 'Idaho', label: 'ID' },
            { value: 'Illinois', label: 'IL' },
            { value: 'Indiana', label: 'IN' },
            { value: 'Iowa', label: 'IA' },
            { value: 'Kansas', label: 'KS' },
            { value: 'Kentucky', label: 'KY' },
            { value: 'Louisiana', label: 'LA' },
            { value: 'Maine', label: 'ME' },
            { value: 'Maryland', label: 'MD' },
            { value: 'Massachusetts', label: 'MA' },
            { value: 'Michigan', label: 'MI' },
            { value: 'Minnesota', label: 'MN' },
            { value: 'Mississippi', label: 'MS' },
            { value: 'Missouri', label: 'MO' },
            { value: 'Montana', label: 'MT' },
            { value: 'Nebraska', label: 'NE' },
            { value: 'Nevada', label: 'NV' },
            { value: 'New Hampshire', label: 'NH' },
            { value: 'New Jersey', label: 'NJ' },
            { value: 'New Mexico', label: 'NM' },
            { value: 'New York', label: 'NY' },
            { value: 'North Carolina', label: 'NC' },
            { value: 'North Dakota', label: 'ND' },
            { value: 'Ohio', label: 'OH' },
            { value: 'Oklahoma', label: 'OK' },
            { value: 'Oregon', label: 'OR' },
            { value: 'Pennsylvania', label: 'PA' },
            { value: 'Rhode Island', label: 'RI' },
            { value: 'South Carolina', label: 'SC' },
            { value: 'South Dakota', label: 'SD' },
            { value: 'Tennessee', label: 'TN' },
            { value: 'Texas', label: 'TX' },
            { value: 'Utah', label: 'UT' },
            { value: 'Vermont', label: 'VT' },
            { value: 'Virginia', label: 'VA' },
            { value: 'Washington', label: 'WA' },
            { value: 'West Virginia', label: 'WV' },
            { value: 'Wisconsin', label: 'WI' },
            { value: 'Wyoming', label: 'WY' }
        ]
    };

    get getProvinceOptions() {
        return this.countryProvinceMap[this._country];
    }
}