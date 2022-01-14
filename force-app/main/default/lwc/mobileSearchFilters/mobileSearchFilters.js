import { LightningElement, api, wire,track } from 'lwc';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/Product2';
import SUB_CAT from '@salesforce/schema/Product2.Subcategory__c';
import PROD_FAM from '@salesforce/schema/Product2.Product_Family__c';


export default class MobileSearchFilters extends LightningElement {
    exposed = false; 
    pf = 'All';
    cat = 'All';
    pfLabel = 'All';
    catLabel ='All';
    @api objectName = 'Product2';
    @api fieldName = 'Subcategory__c';
    @track fieldLabel;
    @api recordTypeId;
    @api value;
    @track options;
    apiFieldName;
    subCat = 'Product2.Subcategory__c';
    productFamily = 'Product2.Product_Family__c';
    @api
    openFilter(){
        this.exposed = true; 
    }
    closeModal(){
        this.exposed = false; 
    }
    cancel(){
        this.pf = 'All';
        this.cat = 'All';
        this.updateFilter(this.cat, this.pf)
        this.closeModal(); 
    }
    @wire(getObjectInfo, { objectApiName: '$objectName' })
    getObjectData({ error, data }) {
        if (data) {
            if (this.recordTypeId == null)
                this.recordTypeId = data.defaultRecordTypeId;
            this.apiFieldName = this.objectName + '.' + this.fieldName;
            this.fieldLabel = data.fields[this.fieldName].label;
            
        } else if (error) {
            // Handle error
            console.log('==============Error  ');
            console.log(error);
        }
    }
        //  //need this to get picklist
        @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$subCat' })
        getPicklistValues({ error, data }) {
            if (data) {
                // Map picklist values
                this.options = data.values.map(plValue => {
                    return {
                        label: plValue.label,
                        value: plValue.value
                    };
                });
    
            } else if (error) {
                // Handle error
                console.log('==============Error  ' + error);
                console.log(error);
            }
        }

   
        //product family options needs to be fixed so it grabs all on load
        get pfOptions(){
            return [
                {label: 'All', value:'All'}, 
                {label: 'Foliar-Pak', value:'Foliar-Pak'},
                {label: 'BASF', value:'BASF'}, 
                {label: 'FMC', value:'FMC'}
            ]
        }
        //category options
        get catOptions(){
            return [
                {label: 'All', value: 'All'}, 
                {label: 'Herbicide', value:'Chemicals-Herbicide'},
                {label: 'Fungicide', value:'Chemicals-Fungicide'},
                {label: 'Insecticide', value:'Chemicals-Insecticide'},
                {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
            ]
        }    
    
    catChange(x){
        this.cat = x.detail.value; 
        this.catLabel = x.target.options.find(opt => opt.value === x.detail.value).label;         
    }
    pfChange(x){
        this.pf = x.detail.value;  
    }

    updateFilter(){
        let filters = {cat: this.cat, catLab: this.catLabel, 
                       pf: this.pf}
        
        
        const updateFilter = new CustomEvent('filterchange',{detail: filters});
        this.dispatchEvent(updateFilter);      
        
        // this.closeModal(); 
        //close filter page
        const closeFilter = new CustomEvent('closefilter');
        this.dispatchEvent(closeFilter)
    }
}
